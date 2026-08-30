import { supabaseAdmin } from '@/lib/supabase/server';
import { FRIEND_SHARE } from '@/lib/referral/constants';

async function addPool(userId: string, field: 'valid_ref_pool' | 'friend_pool', amount: number) {
  if (amount <= 0) return;
  const { data: account } = await supabaseAdmin
    .from('mining_accounts')
    .select('id, valid_ref_pool, friend_pool')
    .eq('user_id', userId)
    .maybeSingle();
  if (!account) return;
  const current = Number(account[field] || 0);
  await supabaseAdmin.from('mining_accounts').update({ [field]: current + amount }).eq('id', account.id);
}

export async function addValidRefPool(userId: string, amount: number) {
  await addPool(userId, 'valid_ref_pool', amount);
}

export async function creditFriendShare(referredUserId: string, claimedAmount: number) {
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

  await addPool(row.referrer_id, 'friend_pool', share);
  return { credited: true, share };
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

  const { error } = await supabaseAdmin
    .from('mining_accounts')
    .update({
      [field]: 0,
      balance: Number(account.balance || 0) + amount,
    })
    .eq('id', account.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, amount, newBalance: Number(account.balance || 0) + amount };
}
