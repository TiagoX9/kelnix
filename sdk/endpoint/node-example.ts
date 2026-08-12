// Example: the endpoint Kelnix telemetry polls for an app's current levels.
//
// Copy into any Node app, adapt the queries, register the route. This is the
// whole integration for pull — no client library, no background thread, and it
// cannot break a request path because nothing else calls it.
//
// Pair with the push SDK when you also want *events* (registrations, payments,
// errors). Push for flows, pull for levels.

import type { FastifyInstance } from 'fastify';

/**
 * The token Kelnix sends. Store it wherever your other secrets live and
 * generate it with `openssl rand -base64 32`.
 */
const TELEMETRY_TOKEN = process.env.TELEMETRY_TOKEN ?? '';

export function registerTelemetryEndpoint(server: FastifyInstance, db: Database): void {
  server.get('/internal/telemetry', async (request, reply) => {
    // Constant-time-ish check is overkill for a 256-bit random token, but the
    // comparison must happen — without it this is a public metrics endpoint.
    const auth = request.headers.authorization;
    if (!TELEMETRY_TOKEN || auth !== `Bearer ${TELEMETRY_TOKEN}`) {
      return reply.code(401).send({ error: 'unauthorized' });
    }

    // RULE: aggregate numbers only. Never a user row, never an email, never a
    // list of anything. If this endpoint starts returning records, the design
    // has gone wrong — Kelnix holds a read credential to this app, and the
    // whole point is that a Kelnix compromise leaks counts and nothing else.
    const [users, subs, mrr] = await Promise.all([
      db.count('SELECT count(*) FROM users WHERE deleted_at IS NULL'),
      db.count("SELECT count(*) FROM subscriptions WHERE status = 'active'"),
      db.count("SELECT COALESCE(sum(amount_cents), 0) FROM subscriptions WHERE status = 'active'"),
    ]);

    // Flat object, integer values. Money in cents, never floats — the column on
    // the other side is a BIGINT, and fractions are silently rounded.
    return reply.send({
      users_total: users,
      active_subscriptions: subs,
      mrr_cents: mrr,
      // Any key you invent is accepted, stored and charted automatically —
      // nothing needs adding on the Kelnix side.
      queue_depth: await db.count('SELECT count(*) FROM jobs WHERE state = $1', ['pending']),
    });
  });
}

// Minimal shape of whatever query helper the host app already has.
interface Database {
  count(sql: string, params?: unknown[]): Promise<number>;
}
