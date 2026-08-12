// Server-side sessions.
//
// Not JWTs. A JWT would have to be either long-lived (unrevocable if leaked) or
// paired with a refresh-token dance, and this dashboard has one operator and a
// database already open. A row in `admin_sessions` is revocable instantly and
// is roughly ten lines of code.
import type { FastifyReply, FastifyRequest } from 'fastify';
import { query } from './db.js';
import { env, isProduction } from './env.js';
import { generateToken, sha256 } from './crypto.js';

export const SESSION_COOKIE = 'kelnix_admin_session';

export interface SessionUser {
  id: number;
  email: string;
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    // kelnix.org and the API subdomain share a registrable domain, so the
    // dashboard's cross-origin fetches still count as same-site and Lax works.
    sameSite: 'lax' as const,
    secure: isProduction,
    path: '/',
    maxAge: maxAgeSeconds,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

/** Issue a session and set the cookie on the reply. */
export async function createSession(
  reply: FastifyReply,
  userId: number,
  userAgent: string | undefined,
  ip: string,
): Promise<void> {
  const token = generateToken();
  const maxAge = env.SESSION_TTL_DAYS * 24 * 60 * 60;

  await query(
    `INSERT INTO admin_sessions (token_hash, user_id, expires_at, user_agent, ip)
     VALUES ($1, $2, now() + ($3 || ' seconds')::interval, $4, $5)`,
    [sha256(token), userId, String(maxAge), userAgent ?? null, ip],
  );

  reply.setCookie(SESSION_COOKIE, token, cookieOptions(maxAge));
}

/** Resolve the session cookie to a user, or null. Expired rows never match. */
export async function getSessionUser(req: FastifyRequest): Promise<SessionUser | null> {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) return null;

  const { rows } = await query<{ id: number; email: string }>(
    `SELECT u.id, u.email
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > now()
        AND u.disabled_at IS NULL`,
    [sha256(token)],
  );

  return rows[0] ?? null;
}

/** Drop the current session and clear the cookie. */
export async function destroySession(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = req.cookies[SESSION_COOKIE];
  if (token) {
    await query('DELETE FROM admin_sessions WHERE token_hash = $1', [sha256(token)]);
  }
  reply.clearCookie(SESSION_COOKIE, cookieOptions(0));
}

/**
 * Fastify preHandler guarding every dashboard route. On success it stashes the
 * user on the request for handlers to read.
 */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await getSessionUser(req);
  if (!user) {
    await reply.code(401).send({ error: 'unauthorized' });
    return;
  }
  req.adminUser = user;
}

declare module 'fastify' {
  interface FastifyRequest {
    adminUser?: SessionUser;
  }
}
