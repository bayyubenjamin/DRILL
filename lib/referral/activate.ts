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

  // Owner rule, 27 Nov 2026 (amendment on top of Frozen v1.0, which said
  // valid = Pass + first claim + 7 days): minting the SBT is enough. A
  // referral becomes valid the moment the friend mints the Drill Pass —
  // no 7-day wait, no first-claim gate. The Pass check lives at the call
  // sites (verify / start / mint all verify the SBT before calling here).
  // The frozen spec document is NOT edited; this amendment is recorded
  // here + in MEMORY.md.
  await supabaseAdmin
    .from('referrals')
    .update({ status: 'valid', reward: REFERRAL_REWARD })
    .eq('id', pending.id);

  await addValidRefPool(pending.referrer_id, REFERRAL_REWARD);
  return { activated: true };
}
