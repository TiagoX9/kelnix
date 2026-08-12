-- Kelnix telemetry — initial schema.
--
-- The shape here is what makes adding app #8 free: `apps` is data, not code.
-- Registering a new application is an INSERT plus an API key, never a
-- migration and never a dashboard change.

-- ─────────────────────────────────────────────────────────────────────────────
-- Applications
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE apps (
  id          SERIAL PRIMARY KEY,
  slug        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  -- Free-form label shown in the UI ('web', 'api', 'mobile', 'mcp'). Not an
  -- enum: a new kind of app must never require a migration.
  kind        TEXT        NOT NULL DEFAULT 'app',
  -- Public URL, used for the health checker and for links in the dashboard.
  url         TEXT,
  -- Display colour for charts. Assigned at creation, stable thereafter, so a
  -- given app keeps its colour across every chart in the dashboard.
  color       TEXT        NOT NULL DEFAULT '#3b82f6',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Archived apps stop appearing in the dashboard but keep their history.
  archived_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Ingest credentials
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE api_keys (
  id           SERIAL PRIMARY KEY,
  app_id       INTEGER     NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  -- SHA-256 of the key. The keys are 256 bits of CSPRNG output, so a fast hash
  -- is the right choice: there is no dictionary to attack, and this runs on
  -- every single ingest request. Passwords use scrypt instead — see below.
  key_hash     TEXT        NOT NULL UNIQUE,
  -- First 8 chars of the key, stored in clear so the UI can show which key is
  -- which without ever being able to reconstruct one.
  key_prefix   TEXT        NOT NULL,
  -- A public key ships inside browser JavaScript, so it is readable by anyone.
  -- It may write events and nothing else: log ingest accepts arbitrary strings
  -- and is the one endpoint worth keeping out of a hostile client's reach.
  is_public    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ
);

CREATE INDEX api_keys_app_idx ON api_keys (app_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Raw events
--
-- Deliberately NOT partitioned. At Kelnix volumes (low thousands of rows a day)
-- a plain table with a retention DELETE is simpler and fast enough. If a single
-- app ever starts producing millions of rows a day, convert this to monthly
-- RANGE partitions on ts — nothing else in the codebase needs to change.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE events (
  id         BIGSERIAL   PRIMARY KEY,
  app_id     INTEGER     NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  -- Event name, e.g. 'pageview', 'user_registered'. See src/events.ts for the
  -- conventional set the dashboard understands; anything else is still stored
  -- and still queryable, it just has no pre-built tile.
  name       TEXT        NOT NULL,
  ts         TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Pseudonymous visitor id. Never a raw IP, never an email. Apps send a salted
  -- hash or a random client id; this is what unique-visitor counts group by.
  anon_id    TEXT,
  session_id TEXT,
  -- Stable identifier for a logged-in user, for DAU/MAU. Apps must send their
  -- internal user id, not an email address.
  user_ref   TEXT,
  props      JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Serves the rollup queries: every one of them filters by app, name and a
-- time window.
CREATE INDEX events_app_name_ts_idx ON events (app_id, name, ts DESC);
-- Serves the retention sweep, which is the only query without an app filter.
CREATE INDEX events_ts_idx ON events (ts);

-- ─────────────────────────────────────────────────────────────────────────────
-- Application logs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE logs (
  id      BIGSERIAL   PRIMARY KEY,
  app_id  INTEGER     NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  ts      TIMESTAMPTZ NOT NULL DEFAULT now(),
  level   TEXT        NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT        NOT NULL,
  context JSONB       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX logs_app_ts_idx ON logs (app_id, ts DESC);
CREATE INDEX logs_level_ts_idx ON logs (level, ts DESC);
CREATE INDEX logs_ts_idx ON logs (ts);

-- ─────────────────────────────────────────────────────────────────────────────
-- Daily rollups
--
-- The dashboard reads ONLY this table. Raw events are for drill-down and
-- recomputation; they are never scanned to render a chart. That is what keeps
-- the dashboard fast on a shared 1.9 GB box, and what lets raw events expire
-- while the history stays.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE metrics_daily (
  app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  day    DATE    NOT NULL,
  metric TEXT    NOT NULL,
  value  BIGINT  NOT NULL,
  PRIMARY KEY (app_id, day, metric)
);

CREATE INDEX metrics_daily_metric_day_idx ON metrics_daily (metric, day DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Uptime checks
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE health_checks (
  id              SERIAL PRIMARY KEY,
  app_id          INTEGER     NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  url             TEXT        NOT NULL,
  method          TEXT        NOT NULL DEFAULT 'GET',
  expected_status INTEGER     NOT NULL DEFAULT 200,
  enabled         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE health_results (
  id          BIGSERIAL   PRIMARY KEY,
  check_id    INTEGER     NOT NULL REFERENCES health_checks(id) ON DELETE CASCADE,
  ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ok          BOOLEAN     NOT NULL,
  status_code INTEGER,
  latency_ms  INTEGER,
  error       TEXT
);

CREATE INDEX health_results_check_ts_idx ON health_results (check_id, ts DESC);
CREATE INDEX health_results_ts_idx ON health_results (ts);

-- ─────────────────────────────────────────────────────────────────────────────
-- Dashboard operators
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT        NOT NULL,
  -- scrypt, not SHA-256: this one IS attackable with a dictionary.
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  disabled_at   TIMESTAMPTZ
);

-- Case-insensitive uniqueness without requiring the citext extension.
CREATE UNIQUE INDEX admin_users_email_idx ON admin_users (lower(email));

CREATE TABLE admin_sessions (
  -- SHA-256 of the session token. The token itself exists only in the user's
  -- cookie, so a database leak cannot be replayed as a login.
  token_hash TEXT        PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip         TEXT
);

CREATE INDEX admin_sessions_user_idx ON admin_sessions (user_id);
CREATE INDEX admin_sessions_expires_idx ON admin_sessions (expires_at);
