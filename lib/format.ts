/**
 * Shared number formatting so every $DRILL amount in the Mini App
 * renders the same way: grouped thousands, fixed decimals.
 * Values are display-only — no rounding logic changes.
 */
export function formatDrill(value: number, digits = 4): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Whole-number counters (invites, levels, pool counts). */
export function formatInt(value: number): string {
  const n = Number.isFinite(value) ? Math.trunc(value) : 0;
  return n.toLocaleString('en-US');
}
