// Ingest endpoints — the only thing every Kelnix app needs to know about.
//
// Plain HTTP + JSON + an `X-Api-Key` header, because the fleet is polyglot:
// Cladget is Node, DataMind and Receipt MCP are Python, the website is browser
// JavaScript. A language-specific client library would have been a wall.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { clientIp, deriveAnonId, resolveApiKey, touchApiKey, type AuthedApp } from '../apiKeys.js';

const MAX_BATCH = 500;
const MAX_PROPS_BYTES = 8_192;

const propsSchema = z
  .record(z.unknown())
  .default({})
  .refine((props) => JSON.stringify(props).length <= MAX_PROPS_BYTES, {
    message: `props must serialise to at most ${MAX_PROPS_BYTES} bytes`,
  });

const eventSchema = z.object({
  name: z.string().min(1).max(100),
  // Clients may backdate events (offline queues, batch imports). Anything
  // without a timestamp is stamped on arrival.
  ts: z.string().datetime({ offset: true }).optional(),
  anon_id: z.string().max(64).optional(),
  session_id: z.string().max(64).optional(),
  user_ref: z.string().max(128).optional(),
  props: propsSchema,
});

// Accepts either a batch or a single event, so a one-line curl works and a
// batching SDK works, without two endpoints.
const eventsBody = z.union([
  z.object({ events: z.array(eventSchema).min(1).max(MAX_BATCH) }),
  eventSchema.transform((event) => ({ events: [event] })),
]);

const logSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']),
  message: z.string().min(1).max(4_000),
  ts: z.string().datetime({ offset: true }).optional(),
  context: propsSchema,
});

const logsBody = z.union([
  z.object({ logs: z.array(logSchema).min(1).max(MAX_BATCH) }),
  logSchema.transform((log) => ({ logs: [log] })),
]);

/** Resolve the API key or answer 401. Returns null when it has already replied. */
async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<AuthedApp | null> {
  const header = req.headers['x-api-key'];
  const headerKey = Array.isArray(header) ? header[0] : header;

  // navigator.sendBeacon cannot set headers, so the browser tracker passes its
  // key as ?k=. Query strings end up in nginx access logs, so that path is
  // restricted to public keys below — a server key must use the header.
  const queryKey = (req.query as { k?: string } | undefined)?.k;
  const rawKey = headerKey ?? queryKey;

  if (!rawKey) {
    await reply.code(401).send({ error: 'missing_api_key' });
    return null;
  }

  const app = await resolveApiKey(rawKey);
  if (!app) {
    await reply.code(401).send({ error: 'invalid_api_key' });
    return null;
  }

  if (!headerKey && !app.isPublic) {
    await reply.code(403).send({ error: 'server_key_must_use_header' });
    return null;
  }

  touchApiKey(app.keyId);
  return app;
}

// Ingest lives under its own /v1/ingest/ prefix so the CORS split in server.ts
// can be a simple prefix test. Sharing /v1/events and /v1/logs with the
// dashboard's readers made "is this an ingest request?" depend on the HTTP
// method, and the dashboard's GET /v1/logs silently inherited the ingest
// policy — which has credentials disabled, so every log query failed.
export function registerIngestRoutes(server: FastifyInstance): void {
  server.post('/v1/ingest/events', async (req, reply) => {
    const app = await authenticate(req, reply);
    if (!app) return;

    const parsed = eventsBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    }

    const { events } = parsed.data;

    // Browser clients never send anon_id — deriving it here from IP + user
    // agent is what keeps the tracker cookieless. Server-side clients send
    // their own stable id and that always wins.
    const fallbackAnonId = deriveAnonId(clientIp(req), String(req.headers['user-agent'] ?? ''));

    // One multi-row INSERT rather than N round trips: beacons arrive in bursts
    // and this service shares a box with everything else.
    const values: unknown[] = [];
    const tuples = events.map((event, i) => {
      const base = i * 7;
      values.push(
        app.appId,
        event.name,
        event.ts ?? new Date().toISOString(),
        event.anon_id ?? fallbackAnonId,
        event.session_id ?? null,
        event.user_ref ?? null,
        JSON.stringify(event.props),
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
    });

    await query(
      `INSERT INTO events (app_id, name, ts, anon_id, session_id, user_ref, props)
       VALUES ${tuples.join(', ')}`,
      values,
    );

    return reply.code(202).send({ accepted: events.length });
  });

  server.post('/v1/ingest/logs', async (req, reply) => {
    const app = await authenticate(req, reply);
    if (!app) return;

    // A public key is readable by anyone who views source on kelnix.org. Log
    // ingest takes arbitrary 4 KB strings, so it stays server-side only.
    if (app.isPublic) {
      return reply.code(403).send({ error: 'public_key_cannot_write_logs' });
    }

    const parsed = logsBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    }

    const { logs } = parsed.data;

    const values: unknown[] = [];
    const tuples = logs.map((log, i) => {
      const base = i * 5;
      values.push(
        app.appId,
        log.ts ?? new Date().toISOString(),
        log.level,
        log.message,
        JSON.stringify(log.context),
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    });

    await query(
      `INSERT INTO logs (app_id, ts, level, message, context)
       VALUES ${tuples.join(', ')}`,
      values,
    );

    return reply.code(202).send({ accepted: logs.length });
  });
}
