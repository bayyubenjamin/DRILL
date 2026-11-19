// Client-side mining helpers. Previously this file was 0 bytes; the
// emission math lived only in lib/mining/emission.ts and the unclaimed
// calculation was inlined in app/page.tsx.
export {
  calculateGlobalQuarterlyEmission,
  applyHalvingPenaltyToSpeed,
} from '@/lib/mining/emission';

/** DRILL accrued since lastClaimAt at the given per-minute mining speed. */
export function computeUnclaimed(miningSpeedPerMin: number, lastClaimAt: string | Date | null): number {
  if (!lastClaimAt || !miningSpeedPerMin) return 0;
  const elapsedMin = Math.max(0, (Date.now() - new Date(lastClaimAt).getTime()) / 60000);
  return elapsedMin * miningSpeedPerMin;
}
