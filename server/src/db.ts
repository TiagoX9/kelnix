// Postgres access. A small pool on purpose: this service shares a 1.9 GB box
// with every other Kelnix app, and telemetry must never be the reason another
// service can't get a connection.
import pg from 'pg';
import { env } from './env.js';

// node-postgres returns BIGINT as a string to avoid precision loss. Every
// bigint we select is a COUNT or a SUM of cents, all far below 2^53, so
// parsing to a number here keeps the JSON responses free of string-vs-number
// surprises in the dashboard.
pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => Number(value));

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 8,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  // An idle client erroring out is recoverable — the pool discards it — but it
  // is worth knowing about, because it usually means Postgres restarted.
  console.error('[db] idle client error', err);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

/** Run `fn` inside a transaction, rolling back on any throw. */
export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
