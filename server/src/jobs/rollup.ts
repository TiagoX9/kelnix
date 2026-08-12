// Nightly aggregation of raw events into metrics_daily.
//
// Idempotent by construction: it recomputes whole days from scratch and upserts
// the result, so running it twice, or re-running it after a backfill, always
// converges on the same numbers.
import { query } from '../db.js';
import { METRIC } from '../events.js';

// Re-aggregate a few days back, not just yesterday. Mobile clients flush queued
// events late and server jobs backdate, so a day is not truly final on midnight.
const LOOKBACK_DAYS = 3;

// Reads a JSONB field as an integer without exploding on junk. A client sending
// {"amount_cents": "twelve"} must not be able to fail the whole rollup.
const jsonInt = (field: string) =>
  `CASE WHEN props ->> '${field}' ~ '^-?[0-9]+$'
        THEN (props ->> '${field}')::bigint
        ELSE 0 END`;

export async function runRollup(lookbackDays = LOOKBACK_DAYS): Promise<number> {
  const { rowCount } = await query(
    `
    WITH window_events AS (
      SELECT id, app_id, name, anon_id, session_id, user_ref, props,
             (ts AT TIME ZONE 'UTC')::date AS day
        FROM events
       WHERE ts >= (CURRENT_DATE - $1::int)
    ),
    computed AS (
      -- Traffic
      SELECT app_id, day, '${METRIC.PAGEVIEWS}' AS metric, COUNT(*)::bigint AS value
        FROM window_events WHERE name = 'pageview' GROUP BY app_id, day
      UNION ALL
      SELECT app_id, day, '${METRIC.VISITORS}', COUNT(DISTINCT anon_id)::bigint
        FROM window_events WHERE anon_id IS NOT NULL GROUP BY app_id, day
      UNION ALL
      SELECT app_id, day, '${METRIC.SESSIONS}', COUNT(DISTINCT session_id)::bigint
        FROM window_events WHERE session_id IS NOT NULL GROUP BY app_id, day

      -- New vs returning.
      --
      -- A visitor is "new" if ANY pageview that day said so, and "returning"
      -- only if none did. Without that rule someone who arrives new and then
      -- reloads — the second load reads the flag their first load wrote — would
      -- be counted in both buckets on the same day.
      UNION ALL
      SELECT app_id, day, '${METRIC.VISITORS_NEW}', COUNT(*)::bigint FROM (
        SELECT app_id, day, anon_id
          FROM window_events
         WHERE name = 'pageview' AND anon_id IS NOT NULL
           AND props ->> 'visit_type' IN ('new', 'returning')
         GROUP BY app_id, day, anon_id
        HAVING bool_or(props ->> 'visit_type' = 'new')
      ) first_timers GROUP BY app_id, day
      UNION ALL
      SELECT app_id, day, '${METRIC.VISITORS_RETURNING}', COUNT(*)::bigint FROM (
        SELECT app_id, day, anon_id
          FROM window_events
         WHERE name = 'pageview' AND anon_id IS NOT NULL
           AND props ->> 'visit_type' IN ('new', 'returning')
         GROUP BY app_id, day, anon_id
        HAVING NOT bool_or(props ->> 'visit_type' = 'new')
      ) repeats GROUP BY app_id, day

      -- Users
      UNION ALL
      SELECT app_id, day, '${METRIC.REGISTRATIONS}', COUNT(*)::bigint
        FROM window_events WHERE name = 'user_registered' GROUP BY app_id, day
      UNION ALL
      SELECT app_id, day, '${METRIC.ACTIVE_USERS}', COUNT(DISTINCT user_ref)::bigint
        FROM window_events WHERE user_ref IS NOT NULL GROUP BY app_id, day

      -- Revenue
      UNION ALL
      SELECT app_id, day, '${METRIC.SUBS_STARTED}', COUNT(*)::bigint
        FROM window_events WHERE name = 'subscription_started' GROUP BY app_id, day
      UNION ALL
      SELECT app_id, day, '${METRIC.SUBS_CANCELLED}', COUNT(*)::bigint
        FROM window_events WHERE name = 'subscription_cancelled' GROUP BY app_id, day
      UNION ALL
      SELECT app_id, day, '${METRIC.REVENUE_CENTS}', SUM(${jsonInt('amount_cents')})::bigint
        FROM window_events WHERE name = 'payment_succeeded' GROUP BY app_id, day
      UNION ALL
      -- MRR is a level: keep the last snapshot reported on each day, not a sum.
      -- Parenthesised because a UNION branch cannot carry a bare ORDER BY, and
      -- DISTINCT ON needs one to decide which row wins.
      (SELECT DISTINCT ON (app_id, day)
              app_id, day, '${METRIC.MRR_CENTS}', ${jsonInt('mrr_cents')}
         FROM window_events WHERE name = 'mrr_snapshot'
        ORDER BY app_id, day, id DESC)

      -- Reliability
      UNION ALL
      SELECT app_id, day, '${METRIC.ERRORS}', COUNT(*)::bigint
        FROM window_events WHERE name = 'error' GROUP BY app_id, day
    )
    INSERT INTO metrics_daily (app_id, day, metric, value)
    SELECT app_id, day, metric, value FROM computed
    ON CONFLICT (app_id, day, metric) DO UPDATE SET value = EXCLUDED.value
    `,
    [lookbackDays],
  );

  return rowCount ?? 0;
}
