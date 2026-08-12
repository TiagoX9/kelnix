// Create (or reset the password of) a dashboard operator.
//
//   node dist/scripts/create-admin.js you@kelnix.org
//
// The password is read from stdin rather than argv so it never lands in shell
// history or in the process list on a shared box.
import { createInterface } from 'node:readline/promises';
import { pool, query } from '../db.js';
import { hashPassword } from '../crypto.js';

async function readPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const password = await rl.question('Password (min 12 chars): ');
  rl.close();
  return password.trim();
}

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email || !email.includes('@')) {
    console.error('Usage: create-admin <email>   (password on stdin or $ADMIN_PASSWORD)');
    process.exit(1);
  }

  const password = await readPassword();
  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  // Re-running with an existing email resets that password, which is the only
  // recovery path — there is no email sender on this box to do a reset link.
  const { rows } = await query<{ id: number; created: boolean }>(
    `INSERT INTO admin_users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (lower(email)) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, (xmax = 0) AS created`,
    [email, passwordHash],
  );

  const row = rows[0]!;
  // A password change must invalidate existing sessions, same as the API does.
  await query('DELETE FROM admin_sessions WHERE user_id = $1', [row.id]);

  console.log(row.created ? `Created admin ${email}` : `Reset password for ${email}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
