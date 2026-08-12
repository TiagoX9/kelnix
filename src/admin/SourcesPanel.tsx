import { useCallback, useEffect, useState } from 'react';
import { api, type AppRow, type MetricRow, type SourceRow } from './api';
import { STATUS } from './palette';
import { formatNumber, formatTime } from './format';
import styles from './Admin.module.css';

/**
 * Pull-based metrics.
 *
 * Events answer "what happened" — registrations this week, payments, errors.
 * They cannot answer "how many users do we have", because a total that predates
 * instrumentation can never be rebuilt from a stream. A metric source is an
 * endpoint on an app that reports its own current levels.
 */
export default function SourcesPanel() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [testing, setTesting] = useState<number | null>(null);
  const [result, setResult] = useState<{ id: number; ok: boolean; detail: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ slug: '', name: 'totals', url: '', token: '', interval_s: 900 });

  const load = useCallback(() => {
    void Promise.all([api.sources(), api.apps(), api.metricNames()]).then(([s, a, m]) => {
      setSources(s.sources);
      setApps(a.apps.filter((app) => !app.archived_at));
      setMetrics(m.metrics);
    });
  }, []);

  useEffect(load, [load]);

  async function addSource() {
    setError(null);
    try {
      await api.createSource(form.slug, {
        name: form.name,
        url: form.url,
        ...(form.token ? { token: form.token } : {}),
        interval_s: form.interval_s,
      });
      setForm({ ...form, url: '', token: '' });
      load();
    } catch {
      setError('Could not create. The URL must be absolute (https://…).');
    }
  }

  async function test(id: number) {
    setTesting(id);
    setResult(null);
    try {
      const res = await api.testSource(id);
      setResult({ id, ...res });
      load();
    } finally {
      setTesting(null);
    }
  }

  async function remove(id: number) {
    await api.deleteSource(id);
    load();
  }

  // Gauges are whatever the apps chose to report, so the table is built from
  // the data rather than from a hardcoded list of column names.
  const gaugeNames = [...new Set(metrics.map((m) => m.metric))].sort();
  const bySlug = new Map<string, Map<string, number>>();
  for (const m of metrics) {
    if (!bySlug.has(m.slug)) bySlug.set(m.slug, new Map());
    bySlug.get(m.slug)!.set(m.metric, m.value);
  }

  return (
    <>
      <section className={styles.card}>
        <p className={styles.chartTitle}>Metric sources</p>
        <p className={styles.note}>
          An endpoint on each app reporting its own current numbers — total users, active
          subscriptions, queue depth. Events tell you what happened; these tell you where
          things stand. Return a flat JSON object of numbers; any key is accepted and
          charted automatically.
        </p>

        <pre className={styles.logContext}>
{`GET /internal/telemetry        Authorization: Bearer <token>

{ "users_total": 1240, "active_subscriptions": 38, "mrr_cents": 45600 }`}
        </pre>

        {sources.length === 0 ? (
          <p className={styles.empty}>No sources configured.</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>App</th>
                  <th>Source</th>
                  <th>Every</th>
                  <th>Gauges</th>
                  <th>Last poll</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td>
                      {/* Icon + label; state never rides on colour alone. */}
                      {source.last_ok === null ? (
                        <span className={styles.statusMuted}>— pending</span>
                      ) : source.last_ok ? (
                        <span style={{ color: STATUS.good }}>● ok</span>
                      ) : (
                        <span style={{ color: STATUS.critical }}>▲ failing</span>
                      )}
                    </td>
                    <td>{source.app_name}</td>
                    <td>
                      {source.name}
                      <span className={styles.subtle}>{source.url}</span>
                      {source.last_error && (
                        <span className={styles.errorInline}>{source.last_error}</span>
                      )}
                      {!source.has_token && (
                        <span className={styles.subtle}>no token — endpoint must be public</span>
                      )}
                    </td>
                    <td>{Math.round(source.interval_s / 60)}m</td>
                    <td>{source.last_gauges ?? '—'}</td>
                    <td>{formatTime(source.last_polled_at)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.linkButton}
                        disabled={testing === source.id}
                        onClick={() => test(source.id)}
                      >
                        {testing === source.id ? 'Testing…' : 'Test'}
                      </button>
                      {' · '}
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => remove(source.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && (
          <p
            className={styles.note}
            style={{ color: result.ok ? STATUS.good : STATUS.critical, marginTop: '0.75rem' }}
          >
            {result.ok ? '● ' : '▲ '}
            {result.detail}
          </p>
        )}

        <div className={styles.filterRow}>
          <select
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={styles.input}
          >
            <option value="">Choose app…</option>
            {apps.map((app) => (
              <option key={app.slug} value={app.slug}>
                {app.name}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            placeholder="Source name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={styles.input}
            placeholder="https://app/internal/telemetry"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Bearer token (optional)"
            value={form.token}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
          />
          <select
            value={form.interval_s}
            onChange={(e) => setForm({ ...form, interval_s: Number(e.target.value) })}
            className={styles.input}
          >
            <option value={300}>every 5m</option>
            <option value={900}>every 15m</option>
            <option value={3600}>every hour</option>
            <option value={21600}>every 6h</option>
          </select>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!form.slug || !form.name || !form.url}
            onClick={addSource}
          >
            Add source
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </section>

      {gaugeNames.length > 0 && (
        <section className={styles.card}>
          <p className={styles.chartTitle}>Latest values</p>
          <p className={styles.note}>
            Every metric currently stored, from either source. Gauges an app invents show up
            here automatically — nothing needs adding to the dashboard.
          </p>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Metric</th>
                  {[...bySlug.keys()].sort().map((slug) => (
                    <th key={slug}>{slug}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gaugeNames.map((metric) => (
                  <tr key={metric}>
                    <td>
                      <code>{metric}</code>
                    </td>
                    {[...bySlug.keys()].sort().map((slug) => {
                      const value = bySlug.get(slug)?.get(metric);
                      return (
                        <td key={slug}>
                          {value === undefined ? (
                            <span className={styles.statusMuted}>—</span>
                          ) : (
                            formatNumber(value)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
