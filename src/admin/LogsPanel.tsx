import { useEffect, useState } from 'react';
import { api, type LogRow, type OverviewApp } from './api';
import { STATUS } from './palette';
import { formatNumber, formatTime } from './format';
import styles from './Admin.module.css';

interface Props {
  days: number;
}

const LEVEL_COLOR: Record<LogRow['level'], string | undefined> = {
  fatal: STATUS.critical,
  error: STATUS.critical,
  warn: STATUS.warning,
  info: undefined,
  debug: undefined,
};

export default function LogsPanel({ days }: Props) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [level, setLevel] = useState('');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [traffic, setTraffic] = useState<OverviewApp[]>([]);

  // Traffic for the same window. 40 errors means nothing on its own — it is
  // either a catastrophe or a rounding error depending on how many visitors
  // there were, and that number lives one tab away otherwise.
  useEffect(() => {
    let cancelled = false;
    void api
      .overview(days)
      .then((res) => !cancelled && setTraffic(res.apps))
      .catch(() => !cancelled && setTraffic([]));
    return () => {
      cancelled = true;
    };
  }, [days]);

  useEffect(() => {
    let cancelled = false;
    // No `setLoading(true)` here: the previous results stay visible while a new
    // query runs, so typing in the search box doesn't strobe the list.
    // Debounced so typing in the search box doesn't fire a query per keystroke.
    const timer = setTimeout(() => {
      api
        .logs({ level: level || undefined, q: q || undefined })
        .then((res) => !cancelled && setLogs(res.logs))
        .catch(() => !cancelled && setLogs([]))
        .finally(() => !cancelled && setLoading(false));
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [level, q]);

  const totals = traffic.reduce(
    (acc, app) => ({
      visitors: acc.visitors + (app.metrics.visitors?.current ?? 0),
      pageviews: acc.pageviews + (app.metrics.pageviews?.current ?? 0),
      errors: acc.errors + (app.metrics.errors?.current ?? 0),
    }),
    { visitors: 0, pageviews: 0, errors: 0 },
  );

  // Errors per thousand pageviews — the number that actually says whether
  // things are bad, rather than how busy you were.
  const errorRate =
    totals.pageviews > 0 ? (totals.errors / totals.pageviews) * 1000 : null;

  return (
    <section className={styles.card}>
      <div className={styles.trafficStrip}>
        <span>
          <strong>{formatNumber(totals.visitors)}</strong> unique visitors
        </span>
        <span>
          <strong>{formatNumber(totals.pageviews)}</strong> pageviews
        </span>
        <span>
          <strong>{formatNumber(totals.errors)}</strong> errors
        </span>
        {errorRate !== null && (
          <span style={{ color: errorRate > 10 ? STATUS.critical : undefined }}>
            <strong>{errorRate.toFixed(1)}</strong> errors per 1k views
          </span>
        )}
        <span className={styles.statusMuted}>last {days} days</span>
      </div>

      <div className={styles.filterRow}>
        <input
          type="search"
          placeholder="Search messages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={styles.input}
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={styles.input}>
          <option value="">All levels</option>
          <option value="fatal">Fatal</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : logs.length === 0 ? (
        <p className={styles.empty}>No log entries match.</p>
      ) : (
        <ul className={styles.logList}>
          {logs.map((log) => (
            <li key={log.id}>
              <button
                type="button"
                className={styles.logRow}
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <span className={styles.logLevel} style={{ color: LEVEL_COLOR[log.level] }}>
                  {log.level.toUpperCase()}
                </span>
                <span className={styles.logApp}>{log.app_name}</span>
                <span className={styles.logMessage}>{log.message}</span>
                <span className={styles.logTime}>{formatTime(log.ts)}</span>
              </button>
              {expanded === log.id && (
                <pre className={styles.logContext}>{JSON.stringify(log.context, null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
