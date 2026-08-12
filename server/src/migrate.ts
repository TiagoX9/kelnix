// Migration runner.
//
// Plain .sql files applied in filename order, each inside its own transaction,
// each recorded in schema_migrations so re-running is a no-op. Deliberately not
// an ORM migration tool: the schema is small, and the rollup queries this
// service lives on are hand-written SQL anyway.
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, transaction } from './db.js';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

async function main(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  const { rows } = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(join(migrationsDir, file), 'utf8');
    // One transaction per file: a migration either lands whole or not at all.
    await transaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });

    console.log(`[migrate] applied ${file}`);
    count += 1;
  }

  console.log(count === 0 ? '[migrate] already up to date' : `[migrate] applied ${count} migration(s)`);
  await pool.end();
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
