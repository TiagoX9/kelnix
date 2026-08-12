// Register an application and mint its first ingest key.
//
//   node dist/scripts/create-app.js <slug> "<name>" [--kind=api] [--url=https://…] [--public]
//
// The same thing the dashboard's "Add app" form does, available from the shell
// for the first app — before there is a dashboard to log into.
import { pool, query } from '../db.js';
import { generateApiKey, sha256 } from '../crypto.js';

function flag(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  const name = process.argv[3];

  if (!slug || !name || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error('Usage: create-app <slug> "<name>" [--kind=api] [--url=https://…] [--public]');
    process.exit(1);
  }

  const isPublic = process.argv.includes('--public');

  const { rows } = await query<{ id: number }>(
    `INSERT INTO apps (slug, name, kind, url, color)
     VALUES ($1, $2, $3, $4, COALESCE($5, '#3b82f6'))
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [slug, name, flag('kind') ?? 'app', flag('url') ?? null, flag('color') ?? null],
  );

  const appId = rows[0]!.id;
  const rawKey = generateApiKey();

  await query(
    `INSERT INTO api_keys (app_id, name, key_hash, key_prefix, is_public)
     VALUES ($1, $2, $3, $4, $5)`,
    [appId, isPublic ? 'public (browser)' : 'server', sha256(rawKey), rawKey.slice(0, 12), isPublic],
  );

  console.log(`App:  ${name} (${slug})`);
  console.log(`Key:  ${rawKey}`);
  console.log(
    isPublic
      ? '\nPublic key — safe to embed in browser JavaScript. Can write events only.'
      : '\nServer key — keep it secret. Shown once; only its hash is stored.',
  );

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
