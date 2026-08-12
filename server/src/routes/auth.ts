// Dashboard login.
//
// kelnix.org is a static site on GitHub Pages, so there is no server in front
// of /admin to protect it. The page is therefore public HTML that holds no
// secrets, and every byte of data behind it is gated here instead.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { verifyPassword } from '../crypto.js';
import { clientIp } from '../apiKeys.js';
import { createSession, destroySession, getSessionUser, requireAdmin } from '../session.js';

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(512),
});

export function registerAuthRoutes(server: FastifyInstance): void {
  server.post(
    '/v1/auth/login',
    {
      // The whole dashboard is one password. Rate limiting it is not optional.
      config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    },
    async (req, reply) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body' });
      }

      const { email, password } = parsed.data;

      const { rows } = await query<{ id: number; password_hash: string }>(
        `SELECT id, password_hash
           FROM admin_users
          WHERE lower(email) = lower($1)
            AND disabled_at IS NULL`,
        [email],
      );

      const user = rows[0];

      // Hash even when the user does not exist, so response time does not
      // reveal which emails are registered.
      const dummyHash = 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128);
      const ok = await verifyPassword(password, user?.password_hash ?? dummyHash);

      if (!user || !ok) {
        return reply.code(401).send({ error: 'invalid_credentials' });
      }

      await createSession(reply, user.id, req.headers['user-agent'], clientIp(req));
      await query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [user.id]);

      return reply.send({ user: { id: user.id, email } });
    },
  );

  server.post('/v1/auth/logout', async (req, reply) => {
    await destroySession(req, reply);
    return reply.send({ ok: true });
  });

  // The dashboard calls this on load to decide between the login screen and
  // the charts, so it answers 200-with-null rather than 401 for an anonymous
  // visitor — a 401 here is indistinguishable from a broken session.
  server.get('/v1/auth/me', async (req, reply) => {
    const user = await getSessionUser(req);
    return reply.send({ user });
  });

  server.post(
    '/v1/auth/password',
    { preHandler: requireAdmin },
    async (req, reply) => {
      const schema = z.object({
        current_password: z.string().min(1),
        new_password: z.string().min(12).max(512),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body', issues: parsed.error.issues });
      }

      const userId = req.adminUser!.id;
      const { rows } = await query<{ password_hash: string }>(
        'SELECT password_hash FROM admin_users WHERE id = $1',
        [userId],
      );

      const stored = rows[0]?.password_hash;
      if (!stored || !(await verifyPassword(parsed.data.current_password, stored))) {
        return reply.code(401).send({ error: 'invalid_credentials' });
      }

      const { hashPassword } = await import('../crypto.js');
      await query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [
        await hashPassword(parsed.data.new_password),
        userId,
      ]);

      // Changing a password invalidates every other session, which is the
      // entire point of changing it after a suspected leak.
      await query('DELETE FROM admin_sessions WHERE user_id = $1', [userId]);
      return reply.send({ ok: true });
    },
  );
}
