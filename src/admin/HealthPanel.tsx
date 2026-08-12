import { useCallback, useEffect, useState } from 'react';
import { api, type AppRow, type HealthRow } from './api';
import { STATUS } from './palette';
import { formatTime } from './format';
import styles from './Admin.module.css';

export default function HealthPanel() {
  const [checks, setChecks] = useState<HealthRow[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  // An API root legitimately returns 404 — there is no route at `/`. Without
  // this field every API check reported a false "down".
  const [expected, setExpected] = useState(200);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void Promise.all([api.health(), api.apps()]).then(([h, a]) => {
      setChecks(h.checks);
      setApps(a.apps.filter((app) => !app.archived_at));
    });
  }, []);

  useEffect(load, [load]);

  async function addCheck() {
    setError(null);
    try {
      await api.createCheck(slug, { name, url, expected_status: expected });
      setName('');
      setUrl('');
      load();
    } catch {
      setError('Could not create the check. Is the URL absolute?');
    }
  }

  async function removeCheck(id: number) {
    await api.deleteCheck(id);
    load();
  }

  return (
    <section className={styles.card}>
      <p className={styles.chartTitle}>Uptime checks</p>

      <p className={styles.note}>
        These run on the same machine as your apps, so they catch a crashed service, a
        failed deploy or an expired certificate — but they cannot tell you the server
        itself is down. Keep one external monitor for that.
      </p>

      {checks.length === 0 ? (
        <p className={styles.empty}>No checks configured.</p>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Status</th>
                <th>App</th>
                <th>Check</th>
                <th>Latency</th>
                <th>24h uptime</th>
                <th>Last run</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.id}>
                  <td>
                    {/* Icon + label: state never rides on colour alone. */}
                    {check.ok === null ? (
                      <span className={styles.statusMuted}>— pending</span>
                    ) : check.ok ? (
                      <span style={{ color: STATUS.good }}>● up</span>
                    ) : (
                      <span style={{ color: STATUS.critical }}>▲ down</span>
                    )}
                  </td>
                  <td>{check.slug}</td>
                  <td>
                    {check.name}
                    <span className={styles.subtle}>{check.url}</span>
                    {check.error && <span className={styles.errorInline}>{check.error}</span>}
                  </td>
                  <td>{check.latency_ms === null ? '—' : `${check.latency_ms}ms`}</td>
                  <td>{check.uptime_24h === null ? '—' : `${check.uptime_24h}%`}</td>
                  <td>{formatTime(check.checked_at)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => removeCheck(check.id)}
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

      <div className={styles.filterRow}>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className={styles.input}>
          <option value="">Choose app…</option>
          {apps.map((app) => (
            <option key={app.slug} value={app.slug}>
              {app.name}
            </option>
          ))}
        </select>
        <input
          className={styles.input}
          placeholder="Check name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className={styles.input}
          type="number"
          style={{ minWidth: '7rem' }}
          title="Expected HTTP status — an API root that returns 404 is healthy"
          value={expected}
          onChange={(e) => setExpected(Number(e.target.value))}
        />
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!slug || !name || !url}
          onClick={addCheck}
        >
          Add check
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
