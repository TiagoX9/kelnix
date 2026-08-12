// Typed client for the telemetry API.
//
// Every call sends credentials, because auth is a session cookie scoped to
// .kelnix.org rather than a token in localStorage — a token readable by
// JavaScript is a token any injected script can exfiltrate.

const BASE = (import.meta.env.VITE_TELEMETRY_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  // Assigned in the body rather than via a parameter property: the app's
  // tsconfig sets `erasableSyntaxOnly`, which rules that syntax out.
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(response.status, body.error ?? `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface MetricPair {
  current: number;
  previous: number;
}

export interface OverviewApp {
  slug: string;
  name: string;
  kind: string;
  url: string | null;
  color: string;
  metrics: Record<string, MetricPair>;
  mrr_cents: number;
  health: { ok: boolean | null; checked_at: string | null; uptime_pct: number | null } | null;
}

export interface SeriesPoint {
  day: string;
  slug: string;
  value: number;
}

export interface LogRow {
  id: number;
  ts: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: Record<string, unknown>;
  slug: string;
  app_name: string;
}

export interface AppRow {
  id: number;
  slug: string;
  name: string;
  kind: string;
  url: string | null;
  color: string;
  created_at: string;
  archived_at: string | null;
  active_keys: number;
  last_ingest_at: string | null;
}

export interface KeyRow {
  id: number;
  name: string;
  key_prefix: string;
  is_public: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface HealthRow {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
  slug: string;
  ok: boolean | null;
  checked_at: string | null;
  latency_ms: number | null;
  error: string | null;
  uptime_24h: number | null;
}

export interface BreakdownRow {
  key: string;
  views: number;
  visitors: number;
}

export interface SourceRow {
  id: number;
  name: string;
  url: string;
  interval_s: number;
  enabled: boolean;
  last_polled_at: string | null;
  last_ok: boolean | null;
  last_error: string | null;
  last_gauges: number | null;
  has_token: boolean;
  slug: string;
  app_name: string;
}

export interface MetricRow {
  metric: string;
  slug: string;
  value: number;
  day: string;
}

// ── Endpoints ───────────────────────────────────────────────────────────────

export const api = {
  me: () => request<{ user: { id: number; email: string } | null }>('/v1/auth/me'),

  login: (email: string, password: string) =>
    request<{ user: { id: number; email: string } }>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: true }>('/v1/auth/logout', { method: 'POST' }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>('/v1/auth/password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),

  overview: (days: number) => request<{ days: number; apps: OverviewApp[] }>(`/v1/overview?days=${days}`),

  metrics: (metric: string, days: number, app?: string) =>
    request<{ metric: string; days: number; points: SeriesPoint[] }>(
      `/v1/metrics?metric=${encodeURIComponent(metric)}&days=${days}${app ? `&app=${app}` : ''}`,
    ),

  logs: (params: { app?: string; level?: string; q?: string; before_id?: number }) => {
    const search = new URLSearchParams();
    if (params.app) search.set('app', params.app);
    if (params.level) search.set('level', params.level);
    if (params.q) search.set('q', params.q);
    if (params.before_id) search.set('before_id', String(params.before_id));
    return request<{ logs: LogRow[] }>(`/v1/logs?${search.toString()}`);
  },

  breakdown: (by: 'path' | 'referrer', days: number, app?: string) =>
    request<{ by: string; rows: BreakdownRow[] }>(
      `/v1/traffic/breakdown?by=${by}&days=${days}${app ? `&app=${app}` : ''}`,
    ),

  apps: () => request<{ apps: AppRow[] }>('/v1/apps'),

  createApp: (body: { slug: string; name: string; kind: string; url?: string }) =>
    request<{ app: AppRow }>('/v1/apps', { method: 'POST', body: JSON.stringify(body) }),

  keys: (slug: string) => request<{ keys: KeyRow[] }>(`/v1/apps/${slug}/keys`),

  createKey: (slug: string, name: string, isPublic: boolean) =>
    request<{ key: KeyRow; secret: string }>(`/v1/apps/${slug}/keys`, {
      method: 'POST',
      body: JSON.stringify({ name, is_public: isPublic }),
    }),

  revokeKey: (id: number) => request<{ ok: true }>(`/v1/keys/${id}`, { method: 'DELETE' }),

  health: () => request<{ checks: HealthRow[] }>('/v1/health'),

  createCheck: (slug: string, body: { name: string; url: string; expected_status?: number }) =>
    request<{ check: unknown }>(`/v1/apps/${slug}/checks`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteCheck: (id: number) => request<{ ok: true }>(`/v1/checks/${id}`, { method: 'DELETE' }),

  sources: () => request<{ sources: SourceRow[] }>('/v1/sources'),

  createSource: (
    slug: string,
    body: { name: string; url: string; token?: string; interval_s?: number },
  ) =>
    request<{ source: SourceRow }>(`/v1/apps/${slug}/sources`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  testSource: (id: number) =>
    request<{ ok: boolean; detail: string }>(`/v1/sources/${id}/test`, { method: 'POST' }),

  deleteSource: (id: number) => request<{ ok: true }>(`/v1/sources/${id}`, { method: 'DELETE' }),

  metricNames: () => request<{ metrics: MetricRow[] }>('/v1/metrics/names'),
};
