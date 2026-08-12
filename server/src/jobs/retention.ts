// Retention sweep.
//
// The box has 28 GB free and no alarm on it, so unbounded growth is a real
// outage waiting to happen. Rollups in metrics_daily are kept forever — they
// are tiny — while the raw rows behind them expire.
import { query } from '../db.js';
import { env } from '../env.js';

// Deleted in chunks so a long-overdue sweep can't hold a lock long enough to
// stall ingest.
const BATCH = 20_000;

async function deleteInBatches(table: 'events' | 'logs', days: number): Promise<number> {
  let total = 0;
  for (;;) {
    const { rowCount } = await query(
      `DELETE FROM ${table}
        WHERE id IN (
          SELECT id FROM ${table}
           WHERE ts < now() - ($1::int || ' days')::interval
           LIMIT ${BATCH}
        )`,
      [days],
    );
    const deleted = rowCount ?? 0;
    total += deleted;
    if (deleted < BATCH) return total;
  }
}

export async function runRetention(): Promise<{
  events: number;
  logs: number;
  health: number;
  sessions: number;
}> {
  const events = await deleteInBatches('events', env.EVENT_RETENTION_DAYS);
  const logs = await deleteInBatches('logs', env.LOG_RETENTION_DAYS);

  // Uptime history is only ever read as "last 24 hours" and "latest result",
  // so 30 days is already generous.
  const health = await query(
    `DELETE FROM health_results WHERE ts < now() - interval '30 days'`,
  );

  const sessions = await query('DELETE FROM admin_sessions WHERE expires_at < now()');

  return {
    events,
    logs,
    health: health.rowCount ?? 0,
    sessions: sessions.rowCount ?? 0,
  };
}
