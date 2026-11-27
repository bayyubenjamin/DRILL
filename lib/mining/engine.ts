// Client-side mining helpers. Previously this file was 0 bytes; the
// emission math lived only in lib/mining/emission.ts and the unclaimed
// calculation was inlined in app/page.tsx.
import { capElapsedMinutes } from '@/lib/mining/emission';

export {
  calculateGlobalQuarterlyEmission,
  applyHalvingPenaltyToSpeed,
} from '@/lib/mining/emission';

/** DRILL accrued since lastClaimAt at the given per-minute mining speed. */
export function computeUnclaimed(miningSpeedPerMin: number, lastClaimAt: string | Date | null): number {
  if (!lastClaimAt || !miningSpeedPerMin) return 0;
  // 24h offline cap (Frozen v1.0 §1) — same as the claim route.
  return capElapsedMinutes(lastClaimAt) * miningSpeedPerMin;
}
