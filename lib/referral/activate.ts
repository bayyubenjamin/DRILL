import { supabaseAdmin } from '@/lib/supabase/server';
import { REFERRAL_REWARD } from '@/lib/referral/constants';

export async function activateReferralIfPending(userId: string) {
  const { data: pending } = await supabaseAdmin
    .from('referrals')
    .select('id, referrer_id, reward, status')
    .eq('referred_id', userId)
    .maybeSingle();

  if (!pending) return;
  if (pending.status === 'valid' || Number(pending.reward || 0) > 0) return;

  await supabaseAdmin
    .from('referrals')
    .update({ status: 'valid', reward: REFERRAL_REWARD })
    .eq('id', pending.id);

  const { data: account } = await supabaseAdmin
    .from('mining_accounts')
    .select('balance')
    .eq('user_id', pending.referrer_id)
    .maybeSingle();

  if (account) {
    await supabaseAdmin
      .from('mining_accounts')
      .update({ balance: Number(account.balance || 0) + REFERRAL_REWARD })
      .eq('user_id', pending.referrer_id);
  }
}
