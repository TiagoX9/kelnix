// Environment contract. Validated once at boot so a missing or malformed value
// fails loudly on startup rather than at 3am inside a request handler.
import { z } from 'zod';

const csv = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Bound to loopback in production: nginx is the only thing that should reach it.
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(4010),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Salt for deriving pseudonymous visitor ids from IP + user agent. Rotated
  // daily in code, which is what makes the browser tracker cookieless: nothing
  // is stored on the visitor's device and yesterday's ids cannot be relinked to
  // today's. Must be stable across restarts or visitor counts double-count.
  ANON_SALT: z.string().min(16, 'ANON_SALT must be at least 16 characters'),

  // 32 bytes, base64, for encrypting metric-source bearer tokens at rest.
  // Generate with: openssl rand -base64 32
  //
  // Losing it does not lose data — only the stored tokens, which are re-entered
  // from each app. Rotating it invalidates every stored token.
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .refine((value) => Buffer.from(value, 'base64').length === 32, {
      message: 'TOKEN_ENCRYPTION_KEY must be 32 bytes of base64 (openssl rand -base64 32)',
    }),

  // Origins allowed to call the dashboard API with credentials. The ingest
  // endpoints are deliberately NOT origin-restricted — they authenticate with
  // an API key and are called from servers, not browsers.
  ADMIN_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform(csv),

  // Leading dot so the session cookie is valid across kelnix.org subdomains.
  // Empty (the dev default) means "don't scope the cookie to a domain at all",
  // which is what localhost needs.
  COOKIE_DOMAIN: z.string().default(''),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(7),

  // Retention. Raw rows are dropped on this schedule; metrics_daily rollups are
  // kept forever, which is what the dashboard actually reads.
  EVENT_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
  LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(30),

  // Background workers. Disable in local dev so a laptop isn't pinging prod.
  JOBS_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  HEALTH_CHECK_INTERVAL_S: z.coerce.number().int().positive().default(300),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  console.error(`Invalid environment:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
