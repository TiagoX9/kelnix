import { useEffect, useMemo, useState } from 'react';
import { api, type BreakdownRow, type OverviewApp, type SeriesPoint } from './api';
import { colorForIndex, STATUS } from './palette';
import { formatCents, formatDelta, formatNumber, formatTime } from './format';
import LineChart, { type Series } from './LineChart';
import styles from './Admin.module.css';

interface Props {
  days: number;
}

// Which metrics get a headline tile, in reading order: how many came, how many
// signed up, how much they paid, how much broke.
const TILES = [
  { key: 'visitors', label: 'Visitors', format: formatNumber },
  { key: 'pageviews', label: 'Pageviews', format: formatNumber },
  { key: 'registrations', label: 'Registrations', format: formatNumber },
  { key: 'active_users', label: 'Active users', format: formatNumber },
  { key: 'revenue_cents', label: 'Revenue', format: formatCents },
  { key: 'errors', label: 'Errors', format: formatNumber, invert: true },
] as const;

const CHARTS = [
  { metric: 'visitors', label: 'Visitors', format: formatNumber },
  { metric: 'registrations', label: 'Registrations', format: formatNumber },
  { metric: 'errors', label: 'Errors', format: formatNumber },
] as const;

export default function Overview({ days }: Props) {
  const [apps, setApps] = useState<OverviewApp[]>([]);
  const [seriesByMetric, setSeriesByMetric] = useState<Record<string, SeriesPoint[]>>({});
  const [pages, setPages] = useState<BreakdownRow[]>([]);
  const [referrers, setReferrers] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Deliberately no `setLoading(true)` here. Changing the range keeps the
    // current numbers on screen until the new ones arrive, instead of blanking
    // the dashboard to "Loading…" for a moment on every click.
    Promise.all([
      api.overview(days),
      ...CHARTS.map((chart) => api.metrics(chart.metric, days)),
      api.breakdown('path', days),
      api.breakdown('referrer', days),
    ])
      .then(([overview, ...rest]) => {
        if (cancelled) return;
        setApps(overview.apps);
        const metrics: Record<string, SeriesPoint[]> = {};
        CHARTS.forEach((chart, i) => {
          metrics[chart.metric] = (rest[i] as { points: SeriesPoint[] }).points;
        });
        setSeriesByMetric(metrics);
        setPages((rest[CHARTS.length] as { rows: BreakdownRow[] }).rows);
        setReferrers((rest[CHARTS.length + 1] as { rows: BreakdownRow[] }).rows);
        setError(null);
      })
      .catch(() => !cancelled && setError('Could not load dashboard data.'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [days]);

  // Colour follows the entity: the index is taken from the stable app list, so
  // an app keeps its colour no matter which chart it appears in.
  const colorBySlug = useMemo(() => {
    const map = new Map<string, string>();
    apps.forEach((app, index) => map.set(app.slug, colorForIndex(index, app.slug)));
    return map;
  }, [apps]);

  const totals = useMemo(() => {
    const sum: Record<string, { current: number; previous: number }> = {};
    for (const tile of TILES) {
      sum[tile.key] = { current: 0, previous: 0 };
      for (const app of apps) {
        const pair = app.metrics[tile.key];
        if (!pair) continue;
        sum[tile.key]!.current += pair.current;
        sum[tile.key]!.previous += pair.previous;
      }
    }
    return sum;
  }, [apps]);

  const totalMrr = useMemo(() => apps.reduce((acc, app) => acc + app.mrr_cents, 0), [apps]);

  function buildSeries(points: SeriesPoint[]): { series: Series[]; days: string[] } {
    const dayList = [...new Set(points.map((p) => p.day))].sort();
    const bySlug = new Map<string, Map<string, number>>();
    for (const point of points) {
      if (!bySlug.has(point.slug)) bySlug.set(point.slug, new Map());
      bySlug.get(point.slug)!.set(point.day, point.value);
    }

    const series = [...bySlug.entries()]
      .map(([slug, values]) => ({
        slug,
        label: apps.find((a) => a.slug === slug)?.name ?? slug,
        color: colorBySlug.get(slug) ?? colorForIndex(0),
        values: dayList.map((day) => values.get(day) ?? 0),
      }))
      // An app that reported nothing at all in the window is noise on the chart.
      .filter((s) => s.values.some((v) => v > 0));

    return { series, days: dayList };
  }

  if (loading) return <p className={styles.empty}>Loading…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <>
      <section className={styles.tileRow}>
        {TILES.map((tile) => {
          const pair = totals[tile.key] ?? { current: 0, previous: 0 };
          const delta = formatDelta(pair.current, pair.previous);
          // For errors, "up" is bad — the arrow keeps its meaning, the colour flips.
          const good =
            delta.direction === 'flat'
              ? null
              : 'invert' in tile && tile.invert
                ? delta.direction === 'down'
                : delta.direction === 'up';

          return (
            <div key={tile.key} className={styles.tile}>
              <span className={styles.tileLabel}>{tile.label}</span>
              <strong className={styles.tileValue}>{tile.format(pair.current)}</strong>
              <span
                className={styles.tileDelta}
                style={{
                  color: good === null ? undefined : good ? STATUS.good : STATUS.critical,
                }}
              >
                {delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : ''} {delta.text}
                <span className={styles.tileDeltaHint}> vs prev {days}d</span>
              </span>
            </div>
          );
        })}

        <div className={styles.tile}>
          <span className={styles.tileLabel}>MRR</span>
          <strong className={styles.tileValue}>{formatCents(totalMrr)}</strong>
          <span className={styles.tileDelta}>
            <span className={styles.tileDeltaHint}>latest reported</span>
          </span>
        </div>
      </section>

      <section className={styles.chartGrid}>
        {CHARTS.map((chart) => {
          const built = buildSeries(seriesByMetric[chart.metric] ?? []);
          return (
            <div key={chart.metric} className={styles.card}>
              {built.series.length === 0 ? (
                <>
                  <p className={styles.chartTitle}>{chart.label}</p>
                  <p className={styles.empty}>Nothing reported in this window.</p>
                </>
              ) : (
                <LineChart
                  title={chart.label}
                  series={built.series}
                  days={built.days}
                  formatValue={chart.format}
                />
              )}
            </div>
          );
        })}
      </section>

      <section className={styles.card}>
        <p className={styles.chartTitle}>Per application</p>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>App</th>
                <th>Visitors</th>
                <th>Registrations</th>
                <th>Active users</th>
                <th>Revenue</th>
                <th>MRR</th>
                <th>Errors</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.slug}>
                  <td>
                    <span
                      className={styles.swatch}
                      style={{ background: colorBySlug.get(app.slug) }}
                      aria-hidden="true"
                    />
                    {app.name}
                    <span className={styles.kindTag}>{app.kind}</span>
                  </td>
                  <td>{formatNumber(app.metrics.visitors?.current ?? 0)}</td>
                  <td>{formatNumber(app.metrics.registrations?.current ?? 0)}</td>
                  <td>{formatNumber(app.metrics.active_users?.current ?? 0)}</td>
                  <td>{formatCents(app.metrics.revenue_cents?.current ?? 0)}</td>
                  <td>{formatCents(app.mrr_cents)}</td>
                  <td>{formatNumber(app.metrics.errors?.current ?? 0)}</td>
                  <td>
                    {/* State ships as icon + label, never colour alone.
                        `ok === null` means the check exists but has not run
                        yet — reporting that as "down" would raise a false
                        alarm on every newly created check. */}
                    {app.health === null ? (
                      <span className={styles.statusMuted}>no check</span>
                    ) : app.health.ok === null ? (
                      <span className={styles.statusMuted}>— pending</span>
                    ) : app.health.ok ? (
                      <span style={{ color: STATUS.good }}>● up</span>
                    ) : (
                      <span style={{ color: STATUS.critical }}>▲ down</span>
                    )}
                    {app.health?.checked_at && (
                      <span className={styles.statusMuted}> {formatTime(app.health.checked_at)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.chartGrid}>
        <Breakdown title="Top pages" rows={pages} />
        <Breakdown title="Top referrers" rows={referrers} />
      </section>
    </>
  );
}

/**
 * Ranked magnitude, so bars — length is the most accurately read encoding.
 * One series, so one hue and no legend: the title names it.
 */
function Breakdown({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.views));

  return (
    <div className={styles.card}>
      <p className={styles.chartTitle}>{title}</p>
      {rows.length === 0 ? (
        <p className={styles.empty}>Nothing yet.</p>
      ) : (
        <ul className={styles.barList}>
          {rows.slice(0, 10).map((row) => (
            <li key={row.key}>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${(row.views / max) * 100}%` }}
                  aria-hidden="true"
                />
                <span className={styles.barLabel} title={row.key}>
                  {row.key || '(direct)'}
                </span>
              </div>
              <span className={styles.barValue}>{formatNumber(row.views)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
