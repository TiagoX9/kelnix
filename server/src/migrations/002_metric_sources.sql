-- Pull-based metrics.
--
-- Events (push) answer "what happened": registrations this week, payments,
-- errors. They cannot answer "how many users do we have" — a total that
-- predates instrumentation can never be reconstructed from a stream.
--
-- A metric source is an endpoint on an app that reports its own current
-- levels. The poller reads it on a schedule and stores each number as a gauge.
--
--   GET /internal/telemetry     Authorization: Bearer <token>
--   { "users_total": 1240, "active_subscriptions": 38, "mrr_cents": 45600 }
--
-- Push for flows, pull for levels.

CREATE TABLE metric_sources (
  id         SERIAL PRIMARY KEY,
  app_id     INTEGER     NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  url        TEXT        NOT NULL,

  -- AES-256-GCM, stored as iv:tag:ciphertext in hex.
  --
  -- Encrypted rather than plain because this is a *read* credential into a
  -- production app — the opposite of an ingest key, which is write-only and
  -- worthless if leaked. A dump of this table must not hand over read access
  -- across the fleet.
  token_encrypted TEXT,

  interval_s INTEGER     NOT NULL DEFAULT 900,
  enabled    BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Last poll outcome, so a silently broken source is visible in the UI
  -- rather than just showing as a flat line on a chart.
  last_polled_at TIMESTAMPTZ,
  last_ok        BOOLEAN,
  last_error     TEXT,
  last_gauges    INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX metric_sources_app_idx ON metric_sources (app_id);
CREATE INDEX metric_sources_due_idx ON metric_sources (enabled, last_polled_at);
