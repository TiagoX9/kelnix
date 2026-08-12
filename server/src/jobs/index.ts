// Background scheduler.
//
// setInterval, not BullMQ. Redis is running on this box for other apps, but
// these three jobs are idempotent, have no fan-out and no retry semantics worth
// modelling — a queue would be infrastructure without a purpose.
import type { FastifyBaseLogger } from 'fastify';
import { env } from '../env.js';
import { runRollup } from './rollup.js';
import { runRetention } from './retention.js';
import { runHealthChecks } from './health.js';
import { runPoll } from './poll.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// Rollups run often rather than nightly so "today" on the dashboard is roughly
// live. Recomputing three days costs milliseconds at Kelnix volumes.
const ROLLUP_INTERVAL = 15 * MINUTE;
const RETENTION_INTERVAL = 24 * HOUR;

/**
 * Wrap a job so it never overlaps itself and never takes the process down.
 * An unhandled rejection inside a timer would kill the API along with it.
 */
function scheduled(name: string, log: FastifyBaseLogger, fn: () => Promise<unknown>) {
  let running = false;
  return async () => {
    if (running) {
      log.warn(`[jobs] ${name} still running, skipping this tick`);
      return;
    }
    running = true;
    const started = Date.now();
    try {
      const result = await fn();
      log.info({ job: name, ms: Date.now() - started, result }, `[jobs] ${name} done`);
    } catch (err) {
      log.error({ job: name, err }, `[jobs] ${name} failed`);
    } finally {
      running = false;
    }
  };
}

export function startJobs(log: FastifyBaseLogger): () => void {
  if (!env.JOBS_ENABLED) {
    log.info('[jobs] disabled');
    return () => {};
  }

  const rollup = scheduled('rollup', log, () => runRollup());
  const retention = scheduled('retention', log, () => runRetention());
  const health = scheduled('health', log, () => runHealthChecks());
  const poll = scheduled('poll', log, () => runPoll());

  const timers = [
    setInterval(rollup, ROLLUP_INTERVAL),
    setInterval(retention, RETENTION_INTERVAL),
    setInterval(health, env.HEALTH_CHECK_INTERVAL_S * 1_000),
    // Ticks often; each source decides whether it is actually due from its own
    // interval_s, so this is a scheduler heartbeat rather than the poll rate.
    setInterval(poll, MINUTE),
  ];

  // Run once at boot so a restart produces fresh numbers immediately rather
  // than after a full interval of staleness.
  void rollup();
  void health();
  void poll();

  return () => timers.forEach(clearInterval);
}
