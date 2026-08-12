// Display formatting shared across the dashboard panels.

export function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `${Math.round(value / 1_000)}k`;
  return value.toLocaleString('en-US');
}

/** Cents to a currency string. Everything is stored in cents to avoid floats. */
export function formatCents(cents: number): string {
  return `€${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export interface Delta {
  text: string;
  direction: 'up' | 'down' | 'flat';
}

/**
 * Percentage change against the previous window.
 *
 * Growth from zero is reported as "new" rather than as an infinite percentage,
 * which is the honest answer — 0 → 5 has no meaningful percentage.
 */
export function formatDelta(current: number, previous: number): Delta {
  if (previous === 0 && current === 0) return { text: '—', direction: 'flat' };
  if (previous === 0) return { text: 'new', direction: 'up' };

  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) return { text: '0%', direction: 'flat' };

  return {
    text: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
    direction: change > 0 ? 'up' : 'down',
  };
}

export function formatTime(iso: string | null): string {
  if (!iso) return 'never';
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}
