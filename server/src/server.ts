// Kelnix telemetry service.
//
// Two very different surfaces behind one process:
//
//   /v1/events, /v1/logs   — API-key auth, callable from anywhere, no cookies.
//   everything else        — session-cookie auth, callable only from kelnix.org.
//
// They get separate CORS policies via Fastify encapsulation rather than one
// permissive policy covering both, because "any origin" plus "send cookies" is
// exactly the combination that turns a dashboard into a CSRF target.
import Fastify, { type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import cors, { type FastifyCorsOptions } from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env, isProduction } from './env.js';
import { pool } from './db.js';
import { startJobs } from './jobs/index.js';
import { registerIngestRoutes } from './routes/ingest.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerDashboardRoutes } from './routes/dashboard.js';
import { registerAppRoutes } from './routes/apps.js';

const server = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    // journald already timestamps every line; a second one is just noise.
    ...(isProduction ? { timestamp: false } : {}),
  },
  // nginx is the only thing in front, so X-Forwarded-For is trustworthy — and
  // req.ip has to be right or every visitor shares one derived anon id.
  trustProxy: true,
  bodyLimit: 2_000_000,
});

async function main(): Promise<void> {
  await server.register(cookie);

  // One CORS registration, two policies, chosen per request.
  //
  // Registering the plugin separately inside each scope reads better but does
  // not work: every registration adds its own wildcard OPTIONS route and the
  // second one collides. The delegator form keeps a single preflight route
  // while still letting ingest and dashboard differ.
  type CorsCallback = (error: Error | null, options: FastifyCorsOptions) => void;

  await server.register(cors, () => (req: FastifyRequest, callback: CorsCallback) => {
    // A prefix test, not a method test: the dashboard also serves /v1/logs and
    // /v1/events/names, and letting those match here stripped their
    // credentials and broke every query behind the login.
    if (req.url.startsWith('/v1/ingest/')) {
      // API-key authenticated and cookie-free, so any origin is fine — the
      // browser tracker has to work from kelnix.org and from any app domain.
      callback(null, { origin: true, credentials: false, methods: ['POST', 'OPTIONS'] });
      return;
    }

    // The dashboard sends cookies, so the origin allowlist is what stands
    // between a session and any site that can convince a browser to call this.
    callback(null, {
      origin: env.ADMIN_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });
  });

  await server.register(rateLimit, {
    max: 600,
    timeWindow: '1 minute',
    // Ingest bursts come from a handful of servers; the limit exists to catch
    // a runaway loop, not to police normal traffic.
    keyGenerator: (req) => req.ip,
  });

  // navigator.sendBeacon sends text/plain and the content type cannot be
  // overridden. Without this the browser tracker's page-unload beacons 415.
  server.addContentTypeParser(
    'text/plain',
    { parseAs: 'string' },
    (_req, body: string, done) => {
      try {
        done(null, body.length ? JSON.parse(body) : {});
      } catch {
        done(new Error('invalid JSON'), undefined);
      }
    },
  );

  server.get('/healthz', async () => ({ ok: true }));

  // Ingest: API-key auth, no session.
  await server.register(async (scope) => registerIngestRoutes(scope));

  // Login and /me must stay reachable without a session. The guarded routes
  // get their own child scopes, which is what keeps their `requireAdmin`
  // preHandler hook off these two.
  await server.register(async (scope) => registerAuthRoutes(scope));
  await server.register(async (guarded) => registerDashboardRoutes(guarded));
  await server.register(async (guarded) => registerAppRoutes(guarded));

  const stopJobs = startJobs(server.log);

  const shutdown = async (signal: string) => {
    server.log.info(`[server] ${signal} received, shutting down`);
    stopJobs();
    await server.close();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await server.listen({ host: env.HOST, port: env.PORT });
}

main().catch((err) => {
  server.log.error(err, '[server] failed to start');
  process.exit(1);
});
