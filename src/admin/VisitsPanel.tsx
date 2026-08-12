import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type AppRow, type EventNameRow, type EventRow } from './api';
import { colorForIndex } from './palette';
import { formatNumber, formatTime } from './format';
import styles from './Admin.module.css';

/**
 * The raw event stream.
 *
 * Every other view is aggregated; this is the one place you can watch traffic
 * arrive event by event and see one visitor's path through the site.
 *
 * The visitor id here is a hash of IP and user agent salted with a value that
 * rotates at midnight UTC. It groups a person's visits *within* a day and is
 * deliberately useless across days — the same visitor tomorrow gets an
 * unrelated id, and nothing here identifies anyone.
 */
/**
 * Referrer hostname, or the raw value if it will not parse.
 *
 * Referrers come from a client and are not guaranteed to be valid URLs — an
 * unguarded `new URL()` here would throw during render and take the whole
 * table down over one malformed string.
 */
function referrerHost(referrer: string | undefined): string {
  if (!referrer) return '(direct)';
  try {
    return new URL(referrer).hostname;
  } catch {
    return referrer.slice(0, 40);
  }
}

export default function VisitsPanel() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [names, setNames] = useState<EventNameRow[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [app, setApp] = useState('');
  const [name, setName] = useState('pageview');
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);

  useEffect(() => {
    void Promise.all([api.apps(), api.eventNames(30)]).then(([a, n]) => {
      setApps(a.apps.filter((x) => !x.archived_at));
      setNames(n.names);
    });
  }, []);

  const load = useCallback(() => {
    void api
      .events({ app: app || undefined, name: name || undefined })
      .then((res) => setEvents(res.events))
      .finally(() => setLoading(false));
  }, [app, name]);

  useEffect(load, [load]);

  async function loadMore() {
    const last = events[events.length - 1];
    if (!last) return;
    setMore(true);
    try {
      const res = await api.events({
        app: app || undefined,
        name: name || undefined,
        before_id: last.id,
      });
      setEvents((prev) => [...prev, ...res.events]);
    } finally {
      setMore(false);
    }
  }

  const colorBySlug = useMemo(() => {
    const map = new Map<string, string>();
    apps.forEach((a, i) => map.set(a.slug, colorForIndex(i, a.slug)));
    return map;
  }, [apps]);

  // How many events each visitor produced in the loaded window, so a row can
  // show "3rd of 7 pages" rather than just a bare id.
  const perVisitor = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (!e.anon_id) continue;
      counts.set(e.anon_id, (counts.get(e.anon_id) ?? 0) + 1);
    }
    return counts;
  }, [events]);

  const uniqueVisitors = perVisitor.size;

  // Distinct event names actually present, so the filter offers what exists
  // rather than a hardcoded list.
  const nameOptions = useMemo(
    () => [...new Set(names.map((n) => n.name))].sort(),
    [names],
  );

  return (
    <section className={styles.card}>
      <p className={styles.chartTitle}>Visit stream</p>
      <p className={styles.note}>
        Individual events as they arrived. The visitor id groups one person's activity
        within a single day — it is a salted hash that rotates at midnight, so the same
        visitor tomorrow appears under a different id and nothing here identifies anyone.
      </p>

      <div className={styles.filterRow}>
        <select value={app} onChange={(e) => setApp(e.target.value)} className={styles.input}>
          <option value="">All apps</option>
          {apps.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name}
            </option>
          ))}
        </select>
        <select value={name} onChange={(e) => setName(e.target.value)} className={styles.input}>
          <option value="">All events</option>
          {nameOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className={styles.streamSummary}>
          {formatNumber(events.length)} events · {formatNumber(uniqueVisitors)} unique visitors
        </span>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : events.length === 0 ? (
        <p className={styles.empty}>Nothing recorded yet for this filter.</p>
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>App</th>
                  <th>Event</th>
                  <th>Page</th>
                  <th>Referrer</th>
                  <th>Visitor</th>
                  <th>Visit</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const props = event.props as Record<string, string | undefined>;
                  const visitType = props.visit_type;
                  return (
                    <tr key={event.id}>
                      <td>{formatTime(event.ts)}</td>
                      <td>
                        <span
                          className={styles.swatch}
                          style={{ background: colorBySlug.get(event.slug) }}
                          aria-hidden="true"
                        />
                        {event.slug}
                      </td>
                      <td>
                        <code>{event.name}</code>
                      </td>
                      <td title={props.path}>{props.path ?? '—'}</td>
                      <td title={props.referrer}>{referrerHost(props.referrer)}</td>
                      <td>
                        {event.anon_id ? (
                          <>
                            <code>{event.anon_id.slice(0, 8)}</code>
                            <span className={styles.statusMuted}>
                              {' '}
                              ({perVisitor.get(event.anon_id)} events)
                            </span>
                          </>
                        ) : (
                          <span className={styles.statusMuted}>—</span>
                        )}
                      </td>
                      <td>
                        {visitType ? (
                          visitType
                        ) : (
                          // Absent means the visitor did not accept the banner,
                          // which is the only way to classify a return.
                          <span className={styles.statusMuted}>unclassified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.filterRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={loadMore}
              disabled={more}
            >
              {more ? 'Loading…' : 'Load older'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
