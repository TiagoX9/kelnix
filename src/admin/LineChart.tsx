import { useMemo, useState } from 'react';
import styles from './Admin.module.css';

export interface Series {
  slug: string;
  label: string;
  color: string;
  values: number[];
}

interface Props {
  series: Series[];
  days: string[];
  formatValue?: (value: number) => string;
  /** Optional caption; the title above the chart already names a single series. */
  title?: string;
}

// Kept close to the rendered pixel width so the viewBox scale factor stays near
// 1 — a 900-unit box squeezed into a 440px card shrinks 11px labels to about
// 5px, which is unreadable no matter how correct the chart is.
const WIDTH = 720;
const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 30, left: 52 };
// Direct labels get their own gutter, but only when few enough series to fit.
const LABEL_GUTTER = 104;
const MAX_DIRECT_LABELS = 4;
// Minimum vertical space between two direct labels before they read as one.
const LABEL_MIN_GAP = 14;

const shortDay = (day: string) => day.slice(5).replace('-', '/');

/**
 * Multi-series line chart on a single value axis.
 *
 * One axis, always: two metrics of different scale get two charts rather than a
 * second y-scale, which is the single most misread thing a dashboard can do.
 */
export default function LineChart({ series, days, formatValue = String, title }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const directLabels = series.length <= MAX_DIRECT_LABELS && series.length > 0;
  const plotRight = WIDTH - PAD.right - (directLabels ? LABEL_GUTTER : 0);
  const plotWidth = plotRight - PAD.left;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const max = useMemo(() => {
    const highest = Math.max(0, ...series.flatMap((s) => s.values));
    // A flat-zero chart still needs a sane axis rather than dividing by zero.
    return highest === 0 ? 1 : highest;
  }, [series]);

  const x = (index: number) =>
    days.length <= 1 ? PAD.left : PAD.left + (index / (days.length - 1)) * plotWidth;
  const y = (value: number) => PAD.top + plotHeight - (value / max) * plotHeight;

  // Four gridlines is enough to read a value without becoming the loudest thing
  // in the frame. Deduplicated because a small max (say 2 errors) rounds
  // several fractions onto the same integer, which would stack identical
  // gridlines and labels on top of each other.
  const ticks = useMemo(
    () => [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f)))],
    [max],
  );

  /**
   * Direct-label y positions, pushed apart where series end at similar values.
   * Without this, two flat low-traffic apps print their names on top of each
   * other and neither is readable.
   */
  const labelY = useMemo(() => {
    if (!directLabels) return new Map<string, number>();

    const placed = series
      .map((s) => ({ slug: s.slug, y: y(s.values[s.values.length - 1] ?? 0) }))
      .sort((a, b) => a.y - b.y);

    for (let i = 1; i < placed.length; i += 1) {
      const previous = placed[i - 1]!;
      const current = placed[i]!;
      if (current.y - previous.y < LABEL_MIN_GAP) current.y = previous.y + LABEL_MIN_GAP;
    }

    return new Map(placed.map((p) => [p.slug, p.y]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, directLabels, max, plotHeight]);

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relative = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (relative - PAD.left) / plotWidth;
    const index = Math.round(ratio * (days.length - 1));
    setHover(index >= 0 && index < days.length ? index : null);
  };

  if (days.length === 0) {
    return <p className={styles.empty}>No data yet.</p>;
  }

  return (
    <div className={styles.chartWrap}>
      {title && <p className={styles.chartTitle}>{title}</p>}

      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={title ?? 'Time series'}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid and axis labels stay recessive — they orient, they don't compete. */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={plotRight}
              y1={y(tick)}
              y2={y(tick)}
              className={styles.gridLine}
            />
            <text x={PAD.left - 10} y={y(tick) + 4} className={styles.axisLabel} textAnchor="end">
              {formatValue(tick)}
            </text>
          </g>
        ))}

        {days.map((day, index) => {
          // Roughly six date labels regardless of range, so they never collide.
          const step = Math.max(1, Math.ceil(days.length / 6));
          if (index % step !== 0 && index !== days.length - 1) return null;
          return (
            <text
              key={day}
              x={x(index)}
              y={HEIGHT - 10}
              className={styles.axisLabel}
              textAnchor="middle"
            >
              {shortDay(day)}
            </text>
          );
        })}

        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + plotHeight}
            className={styles.crosshair}
          />
        )}

        {series.map((s) => {
          const path = s.values
            .map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(value)}`)
            .join(' ');
          return (
            <g key={s.slug}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              {hover !== null && s.values[hover] !== undefined && (
                // A 2px surface ring keeps overlapping markers separable where
                // two series cross.
                <circle
                  cx={x(hover)}
                  cy={y(s.values[hover]!)}
                  r={5}
                  fill={s.color}
                  stroke="#141414"
                  strokeWidth={2}
                />
              )}
              {directLabels && s.values.length > 0 && (
                <text
                  x={plotRight + 8}
                  y={(labelY.get(s.slug) ?? y(s.values[s.values.length - 1]!)) + 4}
                  className={styles.directLabel}
                >
                  {s.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Identity is never carried by colour alone: a legend is always present
          for two or more series, and the swatch sits beside text-token text. */}
      {series.length > 1 && (
        <ul className={styles.legend}>
          {series.map((s) => (
            <li key={s.slug}>
              <span className={styles.swatch} style={{ background: s.color }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      {hover !== null && (
        // Flips to whichever side the cursor is not on, so the readout never
        // sits on top of the points being read.
        <div
          className={styles.tooltip}
          style={
            hover > days.length / 2 ? { left: 0, right: 'auto' } : { right: 0, left: 'auto' }
          }
        >
          <strong>{days[hover]}</strong>
          {series.map((s) => (
            <span key={s.slug}>
              <span className={styles.swatch} style={{ background: s.color }} aria-hidden="true" />
              {s.label}
              <b>{formatValue(s.values[hover] ?? 0)}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
