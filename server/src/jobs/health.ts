// Uptime checks.
//
// A caveat worth stating plainly: these run on the same machine as the apps
// they check, so they cannot detect that machine being down. They catch a
// crashed service, a broken deploy or an expired certificate — not a dead VPS.
// Pair this with one external monitor for the box itself.
import { query } from '../db.js';

const TIMEOUT_MS = 10_000;

interface Check {
  id: number;
  url: string;
  method: string;
  expected_status: number;
}

async function runCheck(check: Check): Promise<void> {
  const started = Date.now();
  let ok = false;
  let statusCode: number | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(check.url, {
      method: check.method,
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'kelnix-telemetry/1.0 (+https://kelnix.org)' },
    });
    statusCode = response.status;
    ok = response.status === check.expected_status;
    if (!ok) error = `expected ${check.expected_status}, got ${response.status}`;
    // Drain the body so the socket is released rather than left half-open.
    await response.arrayBuffer().catch(() => undefined);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  await query(
    `INSERT INTO health_results (check_id, ok, status_code, latency_ms, error)
     VALUES ($1, $2, $3, $4, $5)`,
    [check.id, ok, statusCode, Date.now() - started, error],
  );
}

export async function runHealthChecks(): Promise<number> {
  const { rows } = await query<Check>(
    `SELECT c.id, c.url, c.method, c.expected_status
       FROM health_checks c
       JOIN apps a ON a.id = c.app_id
      WHERE c.enabled AND a.archived_at IS NULL`,
  );

  // Sequential on purpose. There are a handful of checks and they share a box
  // with production traffic; a burst of parallel requests buys nothing.
  for (const check of rows) {
    await runCheck(check).catch((err) => {
      console.error(`[health] check ${check.id} failed to record`, err);
    });
  }

  return rows.length;
}
