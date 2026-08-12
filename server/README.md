# Kelnix Telemetry

One API every Kelnix app reports to, and the data behind **kelnix.org/admin**.

Traffic, users and registrations, revenue, errors and logs, uptime — for every
app, in one place. Adding app number eight takes about two minutes and touches
no code.

---

## Why it is a separate service

The alternative was to bolt this onto an existing backend. None of them fit:

- **Cladget** is the only app with a database, but it is customer-facing. Your
  internal admin login does not belong inside a product your customers use, and
  Cladget going down would blind the tool that tells you Cladget went down.
- **DataMind** and **Receipt MCP** are Python and have no database at all.
- **Convert** and **Revvify** are not deployed anywhere yet.

So it runs as its own systemd service on the shared VPS, with its own Postgres
database on the cluster that is already there. It reuses the machine and the
nginx in front of it, and shares a failure domain with nothing else.

## Architecture

```
  Browsers, Node apps, Python apps
              │  POST /v1/ingest/{events,logs}   (X-Api-Key)
              ▼
  nginx :443 ── telemetry.kelnix.org ──▶ 127.0.0.1:4010 (kelnix-telemetry)
                                              │
  kelnix.org/admin ──── session cookie ───────┤
   (static, GitHub Pages)                     ▼
                                    Postgres  "telemetry"
```

| Piece | Choice | Why |
|---|---|---|
| Runtime | Node 20 + Fastify + zod | Matches the server's node; zod validates every boundary |
| Database | Postgres 16 + raw SQL | Rollups want window functions and `DISTINCT ON`; an ORM fights that |
| Auth (dashboard) | Server-side session cookie | Revocable instantly; no token sitting in localStorage |
| Auth (ingest) | Per-app API key, SHA-256 at rest | High-entropy keys need no slow KDF, and this runs on every request |
| Passwords | `scrypt` from `node:crypto` | Memory-hard, and no native build step on a 1.9 GB box |
| Jobs | `setInterval` | Three idempotent jobs, no fan-out — a queue would be infrastructure for its own sake |

**The rule that keeps it fast:** the dashboard reads `metrics_daily`, never a
scan of `events`. Raw events exist for drill-down and recomputation, and expire
at 90 days. Rollups are tiny and kept forever.

## Adding an application

From **/admin → Apps & keys**, or from the shell:

```bash
ssh root@5.161.229.243
set -a && . /opt/kelnix-telemetry/shared/.env && set +a
cd /opt/kelnix-telemetry/current
node dist/scripts/create-app.js revvify "Revvify" --kind=saas --url=https://revvify.com
```

Then paste the key into that app's environment and send events. No migration,
no deploy of this service, no dashboard change — `apps` is data, not code.

## Sending data

Ingest is plain HTTP + JSON, because the fleet is polyglot. Clients in
[`../sdk/`](../sdk): `node/`, `python/`, `browser/`.

```bash
curl -X POST https://telemetry.kelnix.org/v1/ingest/events \
  -H 'X-Api-Key: klx_...' -H 'Content-Type: application/json' \
  -d '{"name":"user_registered","user_ref":"u_123","props":{"plan":"pro"}}'
```

Send these names and the dashboard populates itself with no extra work
(`src/events.ts` is the source of truth):

| Event | Props | Feeds |
|---|---|---|
| `pageview` | `path`, `referrer`, `title` | Pageviews, top pages, referrers |
| `session_start` | — | Sessions |
| `user_registered` | `plan` | Registrations |
| `user_login` | — (set `user_ref`) | Active users (DAU/MAU) |
| `subscription_started` / `_cancelled` | `plan`, `mrr_cents` | Subscription counts |
| `payment_succeeded` | `amount_cents`, `currency` | Revenue |
| `mrr_snapshot` | `mrr_cents` | MRR |
| `error` | `message`, `route` | Errors |

Any other event name is still stored, still queryable, and shows up in the event
explorer — it just has no pre-built tile.

**`mrr_snapshot` is a level, not a flow.** Report the real current figure on a
schedule (daily cron, or after each Stripe webhook); it cannot be derived by
summing starts minus cancellations once raw events expire.

## The other half: pull

Events answer *what happened*. They cannot answer *how many users do we have* —
a total that predates instrumentation can never be rebuilt from a stream.

So an app can also expose an endpoint reporting its own current levels, and the
poller reads it on a schedule (**Sources** tab in the dashboard):

```
GET /internal/telemetry        Authorization: Bearer <token>

{ "users_total": 1240, "active_subscriptions": 38, "mrr_cents": 45600 }
```

Every finite top-level number is stored as a **gauge** — the latest value wins
for the day, never summed. Strings, nulls and nested objects are ignored, so an
app can add `"version"` or `"generated_at"` without breaking the poll. Any key
you invent is charted automatically; nothing is added to this codebase.

Working examples: [`../sdk/endpoint/`](../sdk/endpoint).

**Push for flows, pull for levels.** Neither replaces the other — only the
browser can report pageviews, and only the app's database knows its user count.

### Two rules

- **Aggregate numbers only.** Never a user row, an email, or a list. Kelnix
  holds a read credential into each app, and the whole design rests on a Kelnix
  compromise leaking counts and nothing else.
- **Tokens are encrypted at rest** (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`) and are
  never returned by any API endpoint, not even masked. This is the opposite of
  an ingest key: those are hashed because we only ever *check* them, while these
  must be replayed on every poll and so must be recoverable.

Rotating `TOKEN_ENCRYPTION_KEY` invalidates every stored token — the sources
keep their configuration and each token is re-entered from the app.

### Two kinds of key

- **Server key** — events *and* logs. Keep it secret.
- **Public key** — events only, safe to embed in browser JavaScript. Log ingest
  accepts arbitrary 4 KB strings, which is the one thing worth keeping out of a
  hostile client's reach.

### Privacy

No cookies, no localStorage, no personal data. The visitor id is a SHA-256 of
IP + user agent + a salt that rotates daily, computed server-side and never
stored raw — so yesterday's ids cannot be relinked to today's. `user_ref` must
be your internal user id, never an email.

## Operations

```bash
systemctl status kelnix-telemetry
journalctl -u kelnix-telemetry -f

# Run a job by hand (backfill, or verify a fresh deploy)
cd /opt/kelnix-telemetry/current
node dist/scripts/run-job.js rollup 400   # recompute 400 days
node dist/scripts/run-job.js retention
node dist/scripts/run-job.js health
node dist/scripts/run-job.js poll

# Reset a password (there is no mail sender on this box, so this is the only path)
node dist/scripts/create-admin.js you@example.com
```

**Rollback** — releases are kept, `current` is a symlink:

```bash
ls -1t /opt/kelnix-telemetry/releases | head
ln -sfn /opt/kelnix-telemetry/releases/<sha> /opt/kelnix-telemetry/current
systemctl restart kelnix-telemetry
```

### Schedules

| Job | Every | Does |
|---|---|---|
| rollup | 15 min | Recomputes the last 3 days into `metrics_daily`, so "today" is roughly live |
| health | 5 min | Pings each registered check |
| poll | 1 min tick | Reads any metric source whose own `interval_s` has elapsed |
| retention | 24 h | Drops events > 90d, logs > 30d, health results > 30d, expired sessions |

### The known blind spot

Uptime checks run on the same machine as the apps they check, so they catch a
crashed service, a broken deploy or an expired certificate — **not the VPS being
down**. Keep one free external monitor (UptimeRobot, Better Stack) pointed at
the domains for that case.

## Local development

```bash
cd server
npm install
createdb kelnix_telemetry_dev

export DATABASE_URL=postgres://localhost/kelnix_telemetry_dev
export ANON_SALT=any-string-at-least-16-chars
export ADMIN_ORIGINS=http://localhost:5173
export JOBS_ENABLED=false

npm run migrate:dev
npx tsx src/scripts/create-admin.js dev@kelnix.org
npm run dev
```

Then run the site with `VITE_TELEMETRY_URL=http://localhost:4010` and open
`/admin`. `COOKIE_DOMAIN` must stay empty locally — localhost cannot carry a
`.kelnix.org` cookie.

## Deployment

`.github/workflows/deploy-telemetry.yml` fires on pushes touching `server/**`.
The runner builds and prunes to production dependencies; the server only
receives an artifact, runs migrations, flips the `current` symlink and restarts.
**The 1.9 GB VPS never compiles anything.**

Requires the `DEPLOY_SSH_KEY` repository secret.
