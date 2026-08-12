import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import Login from './Login';
import Overview from './Overview';
import LogsPanel from './LogsPanel';
import AppsPanel from './AppsPanel';
import HealthPanel from './HealthPanel';
import SourcesPanel from './SourcesPanel';
import styles from './Admin.module.css';

type Tab = 'overview' | 'logs' | 'health' | 'sources' | 'apps';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'logs', label: 'Logs' },
  { id: 'health', label: 'Health' },
  { id: 'sources', label: 'Sources' },
  { id: 'apps', label: 'Apps & keys' },
];

const RANGES = [7, 30, 90];

/**
 * The operations dashboard.
 *
 * This page is served statically from GitHub Pages like the rest of the site,
 * so it is public HTML holding no secrets. Everything that matters is behind
 * the session check below and re-checked by the API on every request — the
 * client-side gate is convenience, never the security boundary.
 */
export default function AdminPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [days, setDays] = useState(30);

  const check = useCallback(() => {
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(check, [check]);

  // The site sets `cursor: none` globally and paints its own cursor. That is a
  // nice touch on a marketing page and an active nuisance on a dense table, so
  // the admin surface opts out — see Admin.module.css.
  useEffect(() => {
    document.title = 'Kelnix — Operations';
  }, []);

  if (checking) {
    return (
      <div className={styles.shell}>
        <p className={styles.empty}>Loading…</p>
      </div>
    );
  }

  if (!user) return <div className={styles.shell}><Login onSuccess={check} /></div>;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>KELNIX</span>
          <span className={styles.brandSub}>Operations</span>
        </div>

        <nav className={styles.tabs}>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? styles.tabActive : styles.tab}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.headerRight}>
          {tab === 'overview' && (
            <div className={styles.rangePicker}>
              {RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  className={days === range ? styles.rangeActive : styles.range}
                  onClick={() => setDays(range)}
                >
                  {range}d
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => void api.logout().then(() => setUser(null))}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {tab === 'overview' && <Overview days={days} />}
        {tab === 'logs' && <LogsPanel />}
        {tab === 'health' && <HealthPanel />}
        {tab === 'sources' && <SourcesPanel />}
        {tab === 'apps' && <AppsPanel />}
      </main>
    </div>
  );
}
