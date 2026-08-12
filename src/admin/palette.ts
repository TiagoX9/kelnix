// Chart palette for the admin dashboard.
//
// Validated, not eyeballed. Against the #141414 card surface in dark mode this
// order passes every hard gate: lightness band, chroma floor, adjacent CVD
// separation (worst ΔE 8.4 protan), normal-vision separation (worst ΔE 19.3)
// and 3:1 contrast. Re-run the check before changing any value here.
//
// Note the first slot is #d95926, not the brand's #FF6B00. Brand orange sits at
// OKLCH L 0.70 — outside the 0.48–0.67 band a dark surface needs — so it stays
// on buttons and headings while charts use its stepped sibling.
export const SERIES_COLORS = [
  '#d95926', // orange  — brand-adjacent, leads the order
  '#3987e5', // blue
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#9085e9', // violet
  '#e66767', // red
  '#008300', // green
] as const;

/**
 * Colour follows the entity, never its rank: an app keeps its colour when a
 * filter removes the apps above it. Falls back to hashing the slug so a ninth
 * app is still stable rather than random.
 */
export function colorForIndex(index: number, slug?: string): string {
  if (index < SERIES_COLORS.length) return SERIES_COLORS[index]!;
  if (!slug) return SERIES_COLORS[SERIES_COLORS.length - 1]!;
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return SERIES_COLORS[hash % SERIES_COLORS.length]!;
}

// Status colours are reserved and never reused as a series colour. Each one
// always ships with an icon and a label, so state is never carried by hue alone.
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const;
