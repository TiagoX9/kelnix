// App and credential management.
//
// This is the scalability surface: onboarding Kelnix app #8 is "create app,
// create key, paste key into that app's env". No migration, no deploy of this
// service, no change to the dashboard.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAdmin } from '../session.js';
import { clearApiKeyCache } from '../apiKeys.js';
import { encryptSecret, generateApiKey, sha256 } from '../crypto.js';
import { pollSourceNow } from '../jobs/poll.js';

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'slug must be lowercase alphanumeric with dashes');

export function registerAppRoutes(server: FastifyInstance): void {
  server.addHook('preHandler', requireAdmin);

  server.get('/v1/apps', async (_req, reply) => {
    const { rows } = await query(
      `SELECT a.id, a.slug, a.name, a.kind, a.url, a.color, a.created_at, a.archived_at,
              COUNT(k.id) FILTER (WHERE k.revoked_at IS NULL)::bigint AS active_keys,
              MAX(k.last_used_at) AS last_ingest_at
         FROM apps a
         LEFT JOIN api_keys k ON k.app_id = a.id
        GROUP BY a.id
        ORDER BY a.archived_at NULLS FIRST, a.name`,
    );
    return reply.send({ apps: rows });
  });

  server.post('/v1/apps', async (req, reply) => {
    const schema = z.object({
      slug: slugSchema,
      name: z.string().min(1).max(120),
      kind: z.string().min(1).max(32).default('app'),
      url: z.string().url().max(500).optional(),
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default('#3b82f6'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    }
    const { slug, name, kind, url, color } = parsed.data;

    const existing = await query('SELECT 1 FROM apps WHERE slug = $1', [slug]);
    if (existing.rowCount) {
      return reply.code(409).send({ error: 'slug_taken' });
    }

    const { rows } = await query(
      `INSERT INTO apps (slug, name, kind, url, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, slug, name, kind, url, color, created_at`,
      [slug, name, kind, url ?? null, color],
    );

    return reply.code(201).send({ app: rows[0] });
  });

  server.patch('/v1/apps/:slug', async (req, reply) => {
    const params = z.object({ slug: slugSchema }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_slug' });

    const schema = z.object({
      name: z.string().min(1).max(120).optional(),
      kind: z.string().min(1).max(32).optional(),
      url: z.string().url().max(500).nullable().optional(),
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      archived: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    }
    const body = parsed.data;

    // COALESCE keeps this a single statement while leaving omitted fields
    // untouched. `url` is nullable, so it gets an explicit "was it provided"
    // flag rather than relying on COALESCE, which cannot distinguish the two.
    const { rows } = await query(
      `UPDATE apps
          SET name  = COALESCE($2, name),
              kind  = COALESCE($3, kind),
              url   = CASE WHEN $4::boolean THEN $5 ELSE url END,
              color = COALESCE($6, color),
              archived_at = CASE
                WHEN $7::boolean IS NULL THEN archived_at
                WHEN $7::boolean THEN COALESCE(archived_at, now())
                ELSE NULL
              END
        WHERE slug = $1
        RETURNING id, slug, name, kind, url, color, archived_at`,
      [
        params.data.slug,
        body.name ?? null,
        body.kind ?? null,
        'url' in body,
        body.url ?? null,
        body.color ?? null,
        body.archived ?? null,
      ],
    );

    if (!rows[0]) return reply.code(404).send({ error: 'not_found' });
    clearApiKeyCache();
    return reply.send({ app: rows[0] });
  });

  // ── API keys ──────────────────────────────────────────────────────────────

  server.get('/v1/apps/:slug/keys', async (req, reply) => {
    const params = z.object({ slug: slugSchema }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_slug' });

    const { rows } = await query(
      `SELECT k.id, k.name, k.key_prefix, k.is_public, k.created_at,
              k.last_used_at, k.revoked_at
         FROM api_keys k
         JOIN apps a ON a.id = k.app_id
        WHERE a.slug = $1
        ORDER BY k.created_at DESC`,
      [params.data.slug],
    );
    return reply.send({ keys: rows });
  });

  server.post('/v1/apps/:slug/keys', async (req, reply) => {
    const params = z.object({ slug: slugSchema }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_slug' });

    const schema = z.object({
      name: z.string().min(1).max(80),
      // Public keys go in browser JavaScript and can only write events.
      is_public: z.boolean().default(false),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    }

    const app = await query<{ id: number }>('SELECT id FROM apps WHERE slug = $1', [
      params.data.slug,
    ]);
    const appId = app.rows[0]?.id;
    if (!appId) return reply.code(404).send({ error: 'not_found' });

    const rawKey = generateApiKey();
    const { rows } = await query(
      `INSERT INTO api_keys (app_id, name, key_hash, key_prefix, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, key_prefix, is_public, created_at`,
      [appId, parsed.data.name, sha256(rawKey), rawKey.slice(0, 12), parsed.data.is_public],
    );

    clearApiKeyCache();

    // The only time the raw key is ever returned. Only its SHA-256 is stored,
    // so a lost key is regenerated, never recovered.
    return reply.code(201).send({ key: rows[0], secret: rawKey });
  });

  server.delete('/v1/keys/:id', async (req, reply) => {
    const params = z.object({ id: z.coerce.number().int().positive() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    const { rowCount } = await query(
      'UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL',
      [params.data.id],
    );
    clearApiKeyCache();

    if (!rowCount) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });

  // ── Health checks ─────────────────────────────────────────────────────────

  server.post('/v1/apps/:slug/checks', async (req, reply) => {
    const params = z.object({ slug: slugSchema }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_slug' });

    const schema = z.object({
      name: z.string().min(1).max(80),
      url: z.string().url().max(500),
      method: z.enum(['GET', 'HEAD']).default('GET'),
      expected_status: z.coerce.number().int().min(100).max(599).default(200),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    }

    const app = await query<{ id: number }>('SELECT id FROM apps WHERE slug = $1', [
      params.data.slug,
    ]);
    const appId = app.rows[0]?.id;
    if (!appId) return reply.code(404).send({ error: 'not_found' });

    const { name, url, method, expected_status } = parsed.data;
    const { rows } = await query(
      `INSERT INTO health_checks (app_id, name, url, method, expected_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, url, method, expected_status, enabled`,
      [appId, name, url, method, expected_status],
    );

    return reply.code(201).send({ check: rows[0] });
  });

  server.delete('/v1/checks/:id', async (req, reply) => {
    const params = z.object({ id: z.coerce.number().int().positive() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    const { rowCount } = await query('DELETE FROM health_checks WHERE id = $1', [params.data.id]);
    if (!rowCount) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });

  // ── Metric sources (pull) ─────────────────────────────────────────────────
  //
  // The token is never returned by any endpoint — not even masked. It is a read
  // credential into a production app, and the dashboard has no reason to
  // display it after it has been stored.

  server.get('/v1/sources', async (_req, reply) => {
    const { rows } = await query(
      `SELECT s.id, s.name, s.url, s.interval_s, s.enabled, s.created_at,
              s.last_polled_at, s.last_ok, s.last_error, s.last_gauges,
              (s.token_encrypted IS NOT NULL) AS has_token,
              a.slug, a.name AS app_name
         FROM metric_sources s
         JOIN apps a ON a.id = s.app_id
        ORDER BY a.name, s.name`,
    );
    return reply.send({ sources: rows });
  });

  server.post('/v1/apps/:slug/sources', async (req, reply) => {
    const params = z.object({ slug: slugSchema }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_slug' });

    const schema = z.object({
      name: z.string().min(1).max(80),
      url: z.string().url().max(500),
      token: z.string().min(1).max(500).optional(),
      // Levels move slowly; polling them every 15 minutes is plenty and keeps
      // load off the app being measured.
      interval_s: z.coerce.number().int().min(60).max(86_400).default(900),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
    }

    const app = await query<{ id: number }>('SELECT id FROM apps WHERE slug = $1', [
      params.data.slug,
    ]);
    const appId = app.rows[0]?.id;
    if (!appId) return reply.code(404).send({ error: 'not_found' });

    const { name, url, token, interval_s } = parsed.data;
    const { rows } = await query(
      `INSERT INTO metric_sources (app_id, name, url, token_encrypted, interval_s)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, url, interval_s, enabled`,
      [appId, name, url, token ? encryptSecret(token) : null, interval_s],
    );

    return reply.code(201).send({ source: rows[0] });
  });

  // Poll immediately and report what came back, so a source can be verified at
  // the moment it is added rather than up to 15 minutes later.
  server.post('/v1/sources/:id/test', async (req, reply) => {
    const params = z.object({ id: z.coerce.number().int().positive() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    const result = await pollSourceNow(params.data.id);
    return reply.send(result);
  });

  server.delete('/v1/sources/:id', async (req, reply) => {
    const params = z.object({ id: z.coerce.number().int().positive() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    const { rowCount } = await query('DELETE FROM metric_sources WHERE id = $1', [params.data.id]);
    if (!rowCount) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });
}
