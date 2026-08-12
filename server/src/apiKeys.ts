// Ingest authentication: resolving an `X-Api-Key` header to an app.
import type { FastifyRequest } from 'fastify';
import { createHash } from 'node:crypto';
import { query } from './db.js';
import { env } from './env.js';
import { sha256 } from './crypto.js';

export interface AuthedApp {
  appId: number;
  slug: string;
  keyId: number;
  isPublic: boolean;
}

// Key lookups happen on every ingest request, so the hash→app mapping is cached
// briefly. Revoking a key therefore takes effect within a minute rather than
// instantly, which is the right trade for not hitting Postgres on every beacon.
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { app: AuthedApp | null; expires: number }>();

export async function resolveApiKey(rawKey: string): Promise<AuthedApp | null> {
  const hash = sha256(rawKey);
  const now = Date.now();

  const cached = cache.get(hash);
  if (cached && cached.expires > now) return cached.app;

  const { rows } = await query<{
    id: number;
    app_id: number;
    slug: string;
    is_public: boolean;
  }>(
    `SELECT k.id, k.app_id, a.slug, k.is_public
       FROM api_keys k
       JOIN apps a ON a.id = k.app_id
      WHERE k.key_hash = $1
        AND k.revoked_at IS NULL
        AND a.archived_at IS NULL`,
    [hash],
  );

  const row = rows[0];
  const app: AuthedApp | null = row
    ? { appId: row.app_id, slug: row.slug, keyId: row.id, isPublic: row.is_public }
    : null;

  cache.set(hash, { app, expires: now + CACHE_TTL_MS });
  return app;
}

/**
 * Best-effort `last_used_at` bookkeeping. Fire-and-forget: a failed write here
 * must never turn a successful ingest into an error response.
 */
export function touchApiKey(keyId: number): void {
  void query('UPDATE api_keys SET last_used_at = now() WHERE id = $1', [keyId]).catch(() => {});
}

/** Strip the cache — used right after a key is created or revoked. */
export function clearApiKeyCache(): void {
  cache.clear();
}

/**
 * Derive a pseudonymous visitor id from IP and user agent, salted with a value
 * that rotates at midnight UTC.
 *
 * This is what lets the browser tracker run without cookies or localStorage:
 * nothing is written to the visitor's device, and because the salt changes
 * daily, today's ids cannot be correlated with yesterday's. The raw IP is never
 * stored — only this digest.
 */
export function deriveAnonId(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256')
    .update(`${env.ANON_SALT}:${day}:${ip}:${userAgent}`)
    .digest('base64url')
    .slice(0, 22);
}

/**
 * The client IP as nginx reports it. Fastify's `trustProxy` resolves
 * X-Forwarded-For for us; this is only a safe fallback.
 */
export function clientIp(req: FastifyRequest): string {
  return req.ip || 'unknown';
}
