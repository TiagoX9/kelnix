// Kelnix telemetry — Node client.
//
// Copy this file into any Node/TypeScript Kelnix app. It has no dependencies.
//
//   import { telemetry } from './kelnix-telemetry.js';
//
//   telemetry.track('user_registered', { userRef: user.id, props: { plan } });
//   telemetry.log('error', 'Stripe webhook failed', { event: evt.type });
//
// Design rules, in priority order:
//   1. Never throw into the host application. Telemetry failing must never be
//      the reason a signup 500s.
//   2. Never block a request. Everything is buffered and flushed in background.
//   3. Never send personal data. `userRef` is your internal id, not an email.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface TrackOptions {
  userRef?: string;
  anonId?: string;
  sessionId?: string;
  props?: Record<string, unknown>;
  /** Override the timestamp when replaying historical data. */
  ts?: Date;
}

interface TelemetryConfig {
  endpoint: string;
  apiKey: string;
  /** Flush when this many items are buffered. */
  batchSize?: number;
  /** Flush at least this often, in milliseconds. */
  flushIntervalMs?: number;
  /** Log transport failures to stderr. Off by default — it is telemetry. */
  debug?: boolean;
}

interface QueuedEvent {
  name: string;
  ts: string;
  anon_id?: string;
  session_id?: string;
  user_ref?: string;
  props: Record<string, unknown>;
}

interface QueuedLog {
  level: LogLevel;
  message: string;
  ts: string;
  context: Record<string, unknown>;
}

export class KelnixTelemetry {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly batchSize: number;
  private readonly debug: boolean;

  private events: QueuedEvent[] = [];
  private logs: QueuedLog[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly enabled: boolean;

  constructor(config: TelemetryConfig) {
    this.endpoint = config.endpoint.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.batchSize = config.batchSize ?? 20;
    this.debug = config.debug ?? false;

    // No key configured means telemetry is simply off. Every method below
    // becomes a no-op, so local development and CI need no special casing.
    this.enabled = Boolean(this.apiKey && this.endpoint);

    if (this.enabled) {
      this.timer = setInterval(() => void this.flush(), config.flushIntervalMs ?? 5_000);
      // Do not hold the process open just to flush telemetry.
      this.timer.unref?.();

      // A crashing or exiting process still gets one last flush attempt.
      process.once('beforeExit', () => void this.flush());
      process.once('SIGTERM', () => void this.flush());
    }
  }

  track(name: string, options: TrackOptions = {}): void {
    if (!this.enabled) return;
    this.events.push({
      name,
      ts: (options.ts ?? new Date()).toISOString(),
      ...(options.anonId ? { anon_id: options.anonId } : {}),
      ...(options.sessionId ? { session_id: options.sessionId } : {}),
      ...(options.userRef ? { user_ref: options.userRef } : {}),
      props: options.props ?? {},
    });
    if (this.events.length >= this.batchSize) void this.flush();
  }

  log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
    if (!this.enabled) return;
    this.logs.push({ level, message: message.slice(0, 4_000), ts: new Date().toISOString(), context });
    // Errors are the reason anyone opens the dashboard — send them right away
    // rather than waiting for the batch to fill.
    if (level === 'error' || level === 'fatal' || this.logs.length >= this.batchSize) {
      void this.flush();
    }
  }

  /** Report current MRR. Call from a daily cron or after a Stripe webhook. */
  reportMrr(mrrCents: number): void {
    this.track('mrr_snapshot', { props: { mrr_cents: Math.round(mrrCents) } });
  }

  /** Send everything buffered. Safe to call at any time; never rejects. */
  async flush(): Promise<void> {
    if (!this.enabled) return;

    // Swap the buffers before awaiting, so events tracked during the request
    // are not dropped by the clear that follows it.
    const events = this.events.splice(0, this.events.length);
    const logs = this.logs.splice(0, this.logs.length);

    await Promise.all([
      events.length ? this.post('/v1/ingest/events', { events }) : Promise.resolve(),
      logs.length ? this.post('/v1/ingest/logs', { logs }) : Promise.resolve(),
    ]);
  }

  private async post(path: string, body: unknown): Promise<void> {
    try {
      const response = await fetch(`${this.endpoint}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok && this.debug) {
        console.error(`[telemetry] ${path} -> ${response.status}`);
      }
    } catch (err) {
      // Dropped on the floor by design. A telemetry outage is invisible to
      // users; a telemetry exception would not be.
      if (this.debug) console.error('[telemetry] transport failed', err);
    }
  }

  /** Stop the flush timer. Only needed in tests. */
  close(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

export const telemetry = new KelnixTelemetry({
  endpoint: process.env.KELNIX_TELEMETRY_URL ?? '',
  apiKey: process.env.KELNIX_TELEMETRY_KEY ?? '',
  debug: process.env.KELNIX_TELEMETRY_DEBUG === 'true',
});
