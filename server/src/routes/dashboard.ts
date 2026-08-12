// Dashboard read API.
//
// Every number on these endpoints comes from `metrics_daily`, never from a scan
// of `events`. That is the rule that keeps the dashboard responsive on a shared
// 1.9 GB box and lets raw events expire at 90 days without losing history.
// The one exception is the log and event explorers, which are explicitly
// drill-down views over recent raw rows and are always bounded by a LIMIT.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAdmin } from '../session.js';
import { METRIC } from '../events.js';

const rangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

/** Metrics summed over a window for the overview cards. */
const SUMMARY_METRICS = [
  METRIC.PAGEVIEWS,
  METRIC.VISITORS,
  METRIC.SESSIONS,
  METRIC.REGISTRATIONS,
  METRIC.ACTIVE_USERS,
  METRIC.REVENUE_CENTS,
  METRIC.ERRORS,
] as const;

export function registerDashboardRoutes(server: FastifyInstance): void {
  server.addHook('preHandler', requireAdmin);

  // ── Overview ──────────────────────────────────────────────────────────────
  // One request paints the whole landing screen: every app, its headline
  // numbers, the change against the previous equal-length window, and current
  // health. Cheap because it is two grouped reads over a small rollup table.
  server.get('/v1/overview', async (req, reply) => {
    const parsed = rangeSchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_query' });
    const { days } = parsed.data;

    const { rows: apps } = await query<{
      id: number;
      slug: string;
      name: string;
      kind: string;
      url: string | null;
      color: string;
    }>(
      `SELECT id, slug, name, kind, url, color
         FROM apps
        WHERE archived_at IS NULL
        ORDER BY name`,
    );

    // Current window and the one immediately before it, in a single pass.
    const { rows: totals } = await query<{
      app_id: number;
      metric: string;
      current: number;
      previous: number;
    }>(
      // SUM() over bigint yields numeric, which node-postgres hands back as a
      // string to protect precision. These are page counts and cents, all far
      // inside float range, so cast back to bigint — otherwise the dashboard
      // receives "4" instead of 4 and every arithmetic comparison in the UI
      // silently becomes string concatenation.
      `SELECT app_id,
              metric,
              COALESCE(SUM(value) FILTER (
                WHERE day > CURRENT_DATE - $1::int
              ), 0)::bigint AS current,
              COALESCE(SUM(value) FILTER (
                WHERE day <= CURRENT_DATE - $1::int
                  AND day > CURRENT_DATE - ($1::int * 2)
              ), 0)::bigint AS previous
         FROM metrics_daily
        WHERE day > CURRENT_DATE - ($1::int * 2)
          AND metric = ANY($2::text[])
        GROUP BY app_id, metric`,
      [days, SUMMARY_METRICS],
    );

    // MRR is a level, not a flow: the latest known value is the answer, and
    // summing it across days would be meaningless.
    const { rows: mrr } = await query<{ app_id: number; value: number }>(
      `SELECT DISTINCT ON (app_id) app_id, value
         FROM metrics_daily
        WHERE metric = $1
        ORDER BY app_id, day DESC`,
      [METRIC.MRR_CENTS],
    );

    const { rows: health } = await query<{
      app_id: number;
      ok: boolean | null;
      checked_at: string | null;
      uptime_pct: number | null;
    }>(
      `SELECT c.app_id,
              latest.ok,
              latest.ts AS checked_at,
              ROUND(
                100.0 * COUNT(*) FILTER (WHERE r.ok) / NULLIF(COUNT(r.id), 0), 2
              )::float8 AS uptime_pct
         FROM health_checks c
         LEFT JOIN LATERAL (
           SELECT ok, ts FROM health_results
            WHERE check_id = c.id
            ORDER BY ts DESC
            LIMIT 1
         ) latest ON TRUE
         LEFT JOIN health_results r
                ON r.check_id = c.id
               AND r.ts > now() - ($1::int || ' days')::interval
        WHERE c.enabled
        GROUP BY c.app_id, latest.ok, latest.ts`,
      [days],
    );

    const byApp = new Map<number, Record<string, { current: number; previous: number }>>();
    for (const row of totals) {
      const entry = byApp.get(row.app_id) ?? {};
      entry[row.metric] = { current: row.current, previous: row.previous };
      byApp.set(row.app_id, entry);
    }

    const mrrByApp = new Map(mrr.map((r) => [r.app_id, r.value]));
    const healthByApp = new Map(health.map((r) => [r.app_id, r]));

    const result = apps.map((app) => {
      const metrics = byApp.get(app.id) ?? {};
      const h = healthByApp.get(app.id);
      return {
        slug: app.slug,
        name: app.name,
        kind: app.kind,
        url: app.url,
        color: app.color,
        metrics: Object.fromEntries(
          SUMMARY_METRICS.map((metric) => [metric, metrics[metric] ?? { current: 0, previous: 0 }]),
        ),
        mrr_cents: mrrByApp.get(app.id) ?? 0,
        health: h
          ? { ok: h.ok, checked_at: h.checked_at, uptime_pct: h.uptime_pct }
          : null,
      };
    });

    return reply.send({ days, apps: result });
  });

  // ── Time series ───────────────────────────────────────────────────────────
  // Zero-filled server-side so the charts never have to reason about gaps: a
  // day with no traffic is a real zero, not a missing point.
  server.get('/v1/metrics', async (req, reply) => {
    const schema = rangeSchema.extend({
      metric: z.string().min(1).max(64),
      app: z.string().min(1).max(64).optional(),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_query' });
    const { days, metric, app } = parsed.data;

    const { rows } = await query<{
      day: string;
      slug: string;
      value: number;
    }>(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
              a.slug,
              COALESCE(m.value, 0) AS value
         FROM generate_series(
                CURRENT_DATE - ($1::int - 1),
                CURRENT_DATE,
                '1 day'::interval
              ) AS d(day)
         CROSS JOIN apps a
         LEFT JOIN metrics_daily m
                ON m.app_id = a.id
               AND m.day = d.day::date
               AND m.metric = $2
        WHERE a.archived_at IS NULL
          AND ($3::text IS NULL OR a.slug = $3)
        ORDER BY d.day, a.slug`,
      [days, metric, app ?? null],
    );

    return reply.send({ metric, days, points: rows });
  });

  // Every metric that exists, with its latest value per app. This is how a
  // gauge an app invented — `queue_depth`, `docs_indexed` — becomes visible
  // without anyone adding it to a list in this codebase.
  server.get('/v1/metrics/names', async (_req, reply) => {
    const { rows } = await query(
      `SELECT DISTINCT ON (m.metric, a.slug)
              m.metric, a.slug, m.value, m.day
         FROM metrics_daily m
         JOIN apps a ON a.id = m.app_id
        WHERE a.archived_at IS NULL
          AND m.day > CURRENT_DATE - 30
        ORDER BY m.metric, a.slug, m.day DESC`,
    );
    return reply.send({ metrics: rows });
  });

  // ── Logs ──────────────────────────────────────────────────────────────────
  server.get('/v1/logs', async (req, reply) => {
    const schema = z.object({
      app: z.string().max(64).optional(),
      level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).optional(),
      q: z.string().max(200).optional(),
      limit: z.coerce.number().int().min(1).max(200).default(100),
      // Keyset pagination: pass the id of the last row you saw. Offset
      // pagination would drift as new logs arrive during scrolling.
      before_id: z.coerce.number().int().positive().optional(),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_query' });
    const { app, level, q, limit, before_id } = parsed.data;

    const { rows } = await query(
      `SELECT l.id, l.ts, l.level, l.message, l.context, a.slug, a.name AS app_name
         FROM logs l
         JOIN apps a ON a.id = l.app_id
        WHERE ($1::text IS NULL OR a.slug = $1)
          AND ($2::text IS NULL OR l.level = $2)
          AND ($3::text IS NULL OR l.message ILIKE '%' || $3 || '%')
          AND ($4::bigint IS NULL OR l.id < $4)
        ORDER BY l.id DESC
        LIMIT $5`,
      [app ?? null, level ?? null, q ?? null, before_id ?? null, limit],
    );

    return reply.send({ logs: rows });
  });

  // ── Event explorer ────────────────────────────────────────────────────────
  // Shows every event name an app has sent recently, including ones with no
  // pre-built tile. This is how a new custom event becomes discoverable.
  server.get('/v1/events/names', async (req, reply) => {
    const parsed = rangeSchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_query' });

    const { rows } = await query(
      `SELECT a.slug, e.name, COUNT(*)::bigint AS count, MAX(e.ts) AS last_seen
         FROM events e
         JOIN apps a ON a.id = e.app_id
        WHERE e.ts > now() - ($1::int || ' days')::interval
        GROUP BY a.slug, e.name
        ORDER BY count DESC
        LIMIT 200`,
      [parsed.data.days],
    );

    return reply.send({ names: rows });
  });

  server.get('/v1/events/recent', async (req, reply) => {
    const schema = z.object({
      app: z.string().max(64).optional(),
      name: z.string().max(100).optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      before_id: z.coerce.number().int().positive().optional(),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_query' });
    const { app, name, limit, before_id } = parsed.data;

    const { rows } = await query(
      `SELECT e.id, e.ts, e.name, e.props, e.anon_id, e.user_ref, a.slug
         FROM events e
         JOIN apps a ON a.id = e.app_id
        WHERE ($1::text IS NULL OR a.slug = $1)
          AND ($2::text IS NULL OR e.name = $2)
          AND ($3::bigint IS NULL OR e.id < $3)
        ORDER BY e.id DESC
        LIMIT $4`,
      [app ?? null, name ?? null, before_id ?? null, limit],
    );

    return reply.send({ events: rows });
  });

  // ── Top pages / referrers ─────────────────────────────────────────────────
  server.get('/v1/traffic/breakdown', async (req, reply) => {
    const schema = rangeSchema.extend({
      app: z.string().max(64).optional(),
      by: z.enum(['path', 'referrer']).default('path'),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_query' });
    const { days, app, by } = parsed.data;

    // `by` is constrained to two literals by the schema above, so interpolating
    // it into the JSON path is safe — it can never carry user input.
    const { rows } = await query(
      `SELECT COALESCE(e.props ->> '${by}', '(none)') AS key,
              COUNT(*)::bigint AS views,
              COUNT(DISTINCT e.anon_id)::bigint AS visitors
         FROM events e
         JOIN apps a ON a.id = e.app_id
        WHERE e.name = 'pageview'
          AND e.ts > now() - ($1::int || ' days')::interval
          AND ($2::text IS NULL OR a.slug = $2)
        GROUP BY key
        ORDER BY views DESC
        LIMIT 50`,
      [days, app ?? null],
    );

    return reply.send({ by, rows });
  });

  // ── Health history ────────────────────────────────────────────────────────
  server.get('/v1/health', async (_req, reply) => {
    const { rows } = await query(
      `SELECT c.id, c.name, c.url, c.enabled, a.slug,
              latest.ok, latest.ts AS checked_at, latest.latency_ms, latest.error,
              ROUND(
                100.0 * COUNT(*) FILTER (WHERE r.ok) / NULLIF(COUNT(r.id), 0), 2
              )::float8 AS uptime_24h
         FROM health_checks c
         JOIN apps a ON a.id = c.app_id
         LEFT JOIN LATERAL (
           SELECT ok, ts, latency_ms, error FROM health_results
            WHERE check_id = c.id ORDER BY ts DESC LIMIT 1
         ) latest ON TRUE
         LEFT JOIN health_results r
                ON r.check_id = c.id AND r.ts > now() - interval '24 hours'
        GROUP BY c.id, c.name, c.url, c.enabled, a.slug,
                 latest.ok, latest.ts, latest.latency_ms, latest.error
        ORDER BY a.slug, c.name`,
    );

    return reply.send({ checks: rows });
  });
}
