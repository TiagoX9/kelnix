// Metric-source poller.
//
// The uptime checker already loops over registered URLs on a timer and records
// what came back. This is the same loop, reading a JSON body of numbers instead
// of just a status code — which is why adding pull support was small.
//
// Everything it stores is a *gauge*: the app's current level, overwritten each
// poll. `users_total` is not summed across polls; the latest value wins for the
// day, the same way `mrr_snapshot` behaves on the push side.
import { query } from '../db.js';
import { decryptSecret } from '../crypto.js';

const TIMEOUT_MS = 10_000;
// A metric source is meant to return a small flat object. Anything much larger
// is a misconfigured endpoint, and reading it in full would be the bug.
const MAX_BYTES = 64 * 1024;

// Metric names become chart series and column keys, so they are constrained
// rather than trusted.
const VALID_METRIC = /^[a-z][a-z0-9_]{0,63}$/;

interface Source {
  id: number;
  app_id: number;
  url: string;
  token_encrypted: string | null;
}

export interface PollOutcome {
  polled: number;
  gauges: number;
  failed: number;
}

/**
 * Extract the numeric gauges from a response body.
 *
 * Only finite top-level numbers count. Strings, nulls, nested objects and
 * arrays are ignored rather than rejected, so an app can add a `"version"` or a
 * `"generated_at"` field to its payload without breaking the poll.
 */
function extractGauges(body: unknown): Array<[string, number]> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return [];

  const gauges: Array<[string, number]> = [];
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    if (!VALID_METRIC.test(key)) continue;
    // metrics_daily.value is BIGINT. Fractional gauges should be sent scaled
    // (mrr_cents, not mrr) — the same convention the push side already uses.
    gauges.push([key, Math.round(value)]);
  }
  return gauges;
}

async function pollOne(source: Source): Promise<number> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'user-agent': 'kelnix-telemetry/1.0 (+https://kelnix.org)',
  };

  if (source.token_encrypted) {
    const token = decryptSecret(source.token_encrypted);
    if (!token) throw new Error('stored token could not be decrypted (key rotated?)');
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(source.url, {
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const text = (await response.text()).slice(0, MAX_BYTES);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error('response was not JSON');
  }

  const gauges = extractGauges(body);
  if (gauges.length === 0) throw new Error('no numeric fields in response');

  // One statement for the whole payload. `day` is UTC so a gauge read at 23:59
  // and again at 00:01 lands on the days the rest of the rollups use.
  const values: unknown[] = [];
  const tuples = gauges.map(([metric, value], i) => {
    values.push(source.app_id, metric, value);
    return `($${i * 3 + 1}, (now() AT TIME ZONE 'UTC')::date, $${i * 3 + 2}, $${i * 3 + 3})`;
  });

  await query(
    `INSERT INTO metrics_daily (app_id, day, metric, value)
     VALUES ${tuples.join(', ')}
     ON CONFLICT (app_id, day, metric) DO UPDATE SET value = EXCLUDED.value`,
    values,
  );

  return gauges.length;
}

export async function runPoll(): Promise<PollOutcome> {
  // Only sources that are actually due, so a source on a 6-hour interval isn't
  // hit every time the job ticks.
  const { rows } = await query<Source>(
    `SELECT s.id, s.app_id, s.url, s.token_encrypted
       FROM metric_sources s
       JOIN apps a ON a.id = s.app_id
      WHERE s.enabled
        AND a.archived_at IS NULL
        AND (s.last_polled_at IS NULL
             OR s.last_polled_at < now() - (s.interval_s || ' seconds')::interval)`,
  );

  let gauges = 0;
  let failed = 0;

  // Sequential: a handful of sources sharing a box with production traffic.
  for (const source of rows) {
    try {
      const count = await pollOne(source);
      gauges += count;
      await query(
        `UPDATE metric_sources
            SET last_polled_at = now(), last_ok = TRUE, last_error = NULL, last_gauges = $2
          WHERE id = $1`,
        [source.id, count],
      );
    } catch (err) {
      failed += 1;
      // Recorded, not thrown: one unreachable app must not stop the others,
      // and a source that has been quietly failing needs to be visible.
      await query(
        `UPDATE metric_sources
            SET last_polled_at = now(), last_ok = FALSE, last_error = $2
          WHERE id = $1`,
        [source.id, err instanceof Error ? err.message.slice(0, 500) : String(err)],
      );
    }
  }

  return { polled: rows.length, gauges, failed };
}

/** Poll a single source immediately, for the "Test" button in the dashboard. */
export async function pollSourceNow(id: number): Promise<{ ok: boolean; detail: string }> {
  const { rows } = await query<Source>(
    'SELECT id, app_id, url, token_encrypted FROM metric_sources WHERE id = $1',
    [id],
  );
  const source = rows[0];
  if (!source) return { ok: false, detail: 'not found' };

  try {
    const count = await pollOne(source);
    await query(
      `UPDATE metric_sources
          SET last_polled_at = now(), last_ok = TRUE, last_error = NULL, last_gauges = $2
        WHERE id = $1`,
      [id, count],
    );
    return { ok: true, detail: `${count} gauge(s) recorded` };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await query(
      `UPDATE metric_sources
          SET last_polled_at = now(), last_ok = FALSE, last_error = $2
        WHERE id = $1`,
      [id, detail.slice(0, 500)],
    );
    return { ok: false, detail };
  }
}
