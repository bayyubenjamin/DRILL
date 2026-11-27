import { supabaseAdmin } from '@/lib/supabase/server';
import { FRIEND_SHARE, FRIEND_SHARE_CAP_PER_QUARTER } from '@/lib/referral/constants';
import { getCurrentQuarterStart } from '@/lib/mining/emission';

// Pool mutations must be atomic (Frozen v1.0 §5: "semua mutasi saldo
// atomik"). The Supabase JS client has no arithmetic UPDATE, so both
// writers below use the same optimistic pattern as the withdrawal route:
// read the value, then UPDATE ... WHERE <field> = <value read>. A lost race
// returns 0 rows instead of silently overwriting the other writer.

async function addPool(userId: string, field: 'valid_ref_pool' | 'friend_pool', amount: number): Promise<boolean> {
  if (amount <= 0) return true;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('id, valid_ref_pool, friend_pool')
      .eq('user_id', userId)
      .maybeSingle();
    if (!account) return false;
    const current = Number(account[field] || 0);
    const { data: updated, error } = await supabaseAdmin
      .from('mining_accounts')
      .update({ [field]: current + amount })
      .eq('id', account.id)
      .eq(field, current)
      .select('id');
    if (error) {
      console.error('addPool update error:', error);
      return false;
    }
    if (updated && updated.length > 0) return true;
    // Empty result = lost the race, another writer moved the pool first.
  }
  console.error('addPool failed after retries (pool NOT credited):', { userId, field, amount });
  return false;
}

export async function addValidRefPool(userId: string, amount: number) {
  await addPool(userId, 'valid_ref_pool', amount);
}

export async function creditFriendShare(
  referredUserId: string,
  claimedAmount: number,
  quarterStart: Date | null = null,
) {
  const share = Number((claimedAmount * FRIEND_SHARE).toFixed(8));
  if (share <= 0) return { credited: false, share: 0 };

  const { data: row } = await supabaseAdmin
    .from('referrals')
    .select('referrer_id, status, reward')
    .eq('referred_id', referredUserId)
    .maybeSingle();
  if (!row) return { credited: false, share: 0 };
  const valid = row.status === 'valid' || Number(row.reward || 0) > 0;
  if (!valid) return { credited: false, share: 0 };

  // Frozen v1.0 §1: friend share caps at 500 DRILL per friend per quarter.
  // Share accrued so far = 5% of this friend's mining claims in the
  // quarter. That sum is exact enough: a friend can only mine (and claim)
  // after the Pass is verified, which is also when the referral activates,
  // so every claim in the window is post-activation. Edge case: claims made
  // while the referral was still pending (too young / no first claim yet)
  // count toward the cap too — conservative, it can only under-pay.
  const windowStart = quarterStart ?? getCurrentQuarterStart(null);
  const { data: claims, error: claimsError } = await supabaseAdmin
    .from('mining_claims')
    .select('amount')
    .eq('user_id', referredUserId)
    .gte('created_at', windowStart.toISOString());
  if (claimsError) {
    console.error('creditFriendShare cap lookup failed (crediting full share):', claimsError);
  }
  const claimedThisQuarter = (claims || []).reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const shareSoFar = claimedThisQuarter * FRIEND_SHARE;
  const remaining = FRIEND_SHARE_CAP_PER_QUARTER - shareSoFar;
  if (remaining <= 0) return { credited: false, share: 0, capped: true };
  const credit = Math.min(share, Number(remaining.toFixed(8)));

  const ok = await addPool(row.referrer_id, 'friend_pool', credit);
  if (!ok) return { credited: false, share: 0 };
  return { credited: true, share: credit, capped: credit < share };
}

export async function claimPool(userId: string, field: 'valid_ref_pool' | 'friend_pool') {
  const { data: account } = await supabaseAdmin
    .from('mining_accounts')
    .select('id, balance, valid_ref_pool, friend_pool')
    .eq('user_id', userId)
    .maybeSingle();
  if (!account) return { ok: false as const, error: 'Mining account not found' };

  const amount = Number(account[field] || 0);
  if (amount <= 0) return { ok: false as const, error: 'Pool is empty' };

  // Atomic: the payout only applies if the pool AND the balance are still
  // what we read. Two pool claims racing each other can no longer both
  // pay the same pool out (previously: read-then-write, double payout).
  const { data: updated, error } = await supabaseAdmin
    .from('mining_accounts')
    .update({
      [field]: 0,
      balance: Number(account.balance || 0) + amount,
    })
    .eq('id', account.id)
    .eq(field, amount)
    .eq('balance', account.balance)
    .select('id');
  if (error) return { ok: false as const, error: error.message };
  if (!updated || updated.length === 0) {
    return { ok: false as const, error: 'Pool changed — please try again' };
  }
  return { ok: true as const, amount, newBalance: Number(account.balance || 0) + amount };
}
