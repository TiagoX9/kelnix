// Register a metric source for an app.
//
//   node dist/scripts/create-source.js <app-slug> <name> <url> [--interval=900]
//
// The bearer token is read from stdin or $SOURCE_TOKEN, never argv, so it does
// not land in shell history or the process list on a shared box.
//
// The same thing the dashboard's Sources tab does, available from the shell —
// for the first source, for a machine with no browser, and for when whoever
// holds the dashboard password is not the person doing the wiring.
import { createInterface } from 'node:readline/promises';
import { pool, query } from '../db.js';
import { encryptSecret } from '../crypto.js';

function flag(name: string, fallback: number): number {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function readToken(): Promise<string> {
  if (process.env.SOURCE_TOKEN) return process.env.SOURCE_TOKEN;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const token = await rl.question('Bearer token (blank for an unauthenticated endpoint): ');
  rl.close();
  return token.trim();
}

async function main(): Promise<void> {
  const [slug, name, url] = process.argv.slice(2);

  if (!slug || !name || !url || !/^https?:\/\//.test(url)) {
    console.error(
      'Usage: create-source <app-slug> <name> <url> [--interval=900]   (token on stdin or $SOURCE_TOKEN)',
    );
    process.exit(1);
  }

  const app = await query<{ id: number }>('SELECT id FROM apps WHERE slug = $1', [slug]);
  const appId = app.rows[0]?.id;
  if (!appId) {
    console.error(`No app with slug "${slug}". Create it first with create-app.`);
    process.exit(1);
  }

  const token = await readToken();
  const intervalS = flag('interval', 900);

  const { rows } = await query<{ id: number }>(
    `INSERT INTO metric_sources (app_id, name, url, token_encrypted, interval_s)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [appId, name, url, token ? encryptSecret(token) : null, intervalS],
  );

  console.log(`Source #${rows[0]!.id} created for ${slug}: ${url} every ${intervalS}s`);
  console.log(
    token
      ? 'Token encrypted at rest. Verify it with: run-job poll'
      : 'No token — the endpoint must be reachable unauthenticated.',
  );

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
