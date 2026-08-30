import { supabaseAdmin } from '@/lib/supabase/server';
import { REFERRAL_REWARD } from '@/lib/referral/constants';
import { addValidRefPool } from '@/lib/referral/pools';

export async function activateReferralIfPending(userId: string) {
  const { data: pending } = await supabaseAdmin
    .from('referrals')
    .select('id, referrer_id, reward, status')
    .eq('referred_id', userId)
    .maybeSingle();

  if (!pending) return { activated: false };
  if (pending.status === 'valid' || Number(pending.reward || 0) > 0) {
    return { activated: false, alreadyValid: true };
  }

  await supabaseAdmin
    .from('referrals')
    .update({ status: 'valid', reward: REFERRAL_REWARD })
    .eq('id', pending.id);

  await addValidRefPool(pending.referrer_id, REFERRAL_REWARD);
  return { activated: true };
}
