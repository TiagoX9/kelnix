import { useEffect, useState } from 'react';
import { api, type LogRow } from './api';
import { STATUS } from './palette';
import { formatTime } from './format';
import styles from './Admin.module.css';

const LEVEL_COLOR: Record<LogRow['level'], string | undefined> = {
  fatal: STATUS.critical,
  error: STATUS.critical,
  warn: STATUS.warning,
  info: undefined,
  debug: undefined,
};

export default function LogsPanel() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [level, setLevel] = useState('');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className={styles.card}>
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
