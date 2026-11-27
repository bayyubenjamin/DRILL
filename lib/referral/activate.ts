import { supabaseAdmin } from '@/lib/supabase/server';
import { REFERRAL_REWARD } from '@/lib/referral/constants';
import { addValidRefPool } from '@/lib/referral/pools';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

  // Frozen v1.0: valid = Pass on-chain + first mining claim + 7 days since
  // join. The Pass check lives at the call sites (verify / start / mint
  // all verify the SBT before calling here); the two gates below are
  // enforced here. Callers ignore the result on purpose — they re-run
  // activation on the next verify/start/mint/claim, so a referral that is
  // too young or claim-less today activates itself later, no manual step.
  const { data: referred } = await supabaseAdmin
    .from('users')
    .select('created_at')
    .eq('id', userId)
    .maybeSingle();
  const joinedAt = referred?.created_at ? new Date(referred.created_at).getTime() : NaN;
  if (!Number.isFinite(joinedAt) || Date.now() - joinedAt < SEVEN_DAYS_MS) {
    return { activated: false, reason: 'account_too_young' };
  }

  const { data: firstClaim } = await supabaseAdmin
    .from('mining_claims')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (!firstClaim) {
    return { activated: false, reason: 'no_first_claim' };
  }

  await supabaseAdmin
    .from('referrals')
    .update({ status: 'valid', reward: REFERRAL_REWARD })
    .eq('id', pending.id);

  await addValidRefPool(pending.referrer_id, REFERRAL_REWARD);
  return { activated: true };
}
