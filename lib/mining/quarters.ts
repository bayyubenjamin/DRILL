import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateGlobalQuarterlyEmission, getCurrentQuarterStart } from '@/lib/mining/emission';

// Quarterly emission enforcement — Frozen v1.0 §1-§3.
//
// Design (already in supabase/migrations/0001_full_schema.sql):
//   - app_config.genesis_timestamp: set at Jetton mainnet deploy (00:00 UTC
//     of deploy day). NULL until then on purpose — no mining quarter may
//     start before mainnet exists, so on testnet the quota is skipped.
//   - emission_quarters(quarter_start PK, budget, minted): one row per
//     90-day quarter; `minted` is the running total of mining claims
//     credited in that quarter. The claim path increments it with a
//     conditional update and refuses when minted >= budget.
//
// Failure mode: if these tables are missing (migration not applied) the
// quota lookups fail-open with a log line and the claim still goes through
// — blocking all mining on a missing table would be worse. Check the logs
// and apply the migration if you see these errors.

export type QuarterInfo = {
  /** Start of the current quarter (null = no mainnet quarter yet). */
  start: Date | null;
  /** Hard cap for this quarter (null = no cap enforced). */
  budget: number | null;
};

/** Reads genesis from app_config and derives the current quarter + budget. */
export async function readQuarterInfo(): Promise<QuarterInfo> {
  const { data, error } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'genesis_timestamp')
    .maybeSingle();
  if (error) {
    console.error('quarters: genesis lookup failed (quota skipped):', error);
    return { start: null, budget: null };
  }
  const genesisSec = data?.value ? Number(data.value) : NaN;
  if (!Number.isFinite(genesisSec) || genesisSec <= 0) {
    return { start: null, budget: null };
  }
  return {
    start: getCurrentQuarterStart(genesisSec),
    budget: calculateGlobalQuarterlyEmission(genesisSec),
  };
}

/** DRILL still available in this quarter's budget (0 when exhausted). */
export async function getQuarterRemaining(start: Date, budget: number): Promise<number> {
  const iso = start.toISOString();
  const { data, error } = await supabaseAdmin
    .from('emission_quarters')
    .select('minted')
    .eq('quarter_start', iso)
    .maybeSingle();
  if (error) {
    console.error('quarters: remaining lookup failed (treating budget as full):', error);
    return budget;
  }
  return Math.max(0, budget - Number(data?.minted || 0));
}

/**
 * Atomically adds `amount` to this quarter's minted total. Uses the same
 * optimistic pattern as the withdrawal balance guard: read minted, then
 * update only if minted is still what we read. Retries once on a lost
 * race. Returns false when the row could not be updated (caller logs it;
 * the claim itself was already credited, so a false here means the counter
 * under-counts slightly — bounded overshoot, never a lost payout).
 */
export async function incrementQuarterMinted(start: Date, budget: number, amount: number): Promise<boolean> {
  const iso = start.toISOString();
  // Make sure the row exists (first claim of the quarter creates it).
  // ignoreDuplicates: never overwrite `minted` of an existing row.
  const { error: upsertError } = await supabaseAdmin
    .from('emission_quarters')
    .upsert({ quarter_start: iso, budget, minted: 0 }, { onConflict: 'quarter_start', ignoreDuplicates: true });
  if (upsertError) {
    console.error('quarters: ensure row failed:', upsertError);
    return false;
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: row, error: readError } = await supabaseAdmin
      .from('emission_quarters')
      .select('minted')
      .eq('quarter_start', iso)
      .maybeSingle();
    if (readError || !row) {
      console.error('quarters: minted read failed:', readError);
      return false;
    }
    const minted = Number(row.minted || 0);
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('emission_quarters')
      .update({ minted: minted + amount, updated_at: new Date().toISOString() })
      .eq('quarter_start', iso)
      .eq('minted', minted)
      .select('quarter_start');
    if (!updateError && updated && updated.length > 0) return true;
    if (updateError) {
      console.error('quarters: minted update failed:', updateError);
      return false;
    }
    // Empty result = lost the race, another claim moved `minted` first.
  }
  console.error('quarters: minted increment lost the race twice, giving up');
  return false;
}
