import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed } from '@/lib/level/calculator';
import { hasOnchainPass } from '@/lib/ton/pass';
import { capElapsedMinutes, getCurrentQuarterStart } from '@/lib/mining/emission';
import { getQuarterRemaining, incrementQuarterMinted, readQuarterInfo } from '@/lib/mining/quarters';
import { creditFriendShare } from '@/lib/referral/pools';
import { activateReferralIfPending } from '@/lib/referral/activate';

export async function POST(request: Request) {
  try {
    const { initData, walletAddress } = await request.json();
    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    if (!walletAddress || !(await hasOnchainPass(walletAddress))) {
      return NextResponse.json({ error: 'On-chain SBT required' }, { status: 403 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('id, balance, mining_speed, last_claim_at, mining_active')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!account) return NextResponse.json({ error: 'Mining account not found' }, { status: 404 });
    if (!account.mining_active) return NextResponse.json({ error: 'Mining is not active' }, { status: 403 });
    if (!account.last_claim_at) return NextResponse.json({ error: 'Nothing to claim' }, { status: 400 });

    const now = new Date();
    const lastClaimAt = new Date(account.last_claim_at);
    // Frozen v1.0 §1: offline accrual stops after 24h. Without this cap a
    // user idle for a year could claim ~63,000 DRILL in one tap (spec max
    // is 172.8/day at top speed).
    const elapsedMinutes = capElapsedMinutes(lastClaimAt, now.getTime());
    const speed = Number(account.mining_speed || 0);
    let rewardAmount = Number((speed * elapsedMinutes).toFixed(8));
    if (rewardAmount <= 0) {
      return NextResponse.json({ error: 'Nothing to claim yet' }, { status: 400 });
    }

    // Frozen v1.0 §1-§3: quarterly hard cap. When the quarter's budget is
    // gone, mining pauses. Genesis lives in app_config (NULL until mainnet
    // deploy) — before mainnet there is no quarter, so no cap yet.
    const quarter = await readQuarterInfo();
    // Friend-share cap needs a quarter window even pre-mainnet: calendar
    // quarter is the fallback there (see lib/mining/emission.ts).
    const shareQuarterStart = quarter.start ?? getCurrentQuarterStart(null);
    let emissionCapped = false;
    if (quarter.start && quarter.budget) {
      const remaining = await getQuarterRemaining(quarter.start, quarter.budget);
      if (remaining <= 0) {
        return NextResponse.json(
          { error: 'Quarterly emission exhausted — mining paused until next quarter' },
          { status: 403 },
        );
      }
      if (rewardAmount > remaining) {
        rewardAmount = Number(remaining.toFixed(8));
        emissionCapped = true;
      }
    }

    const newBalance = Number(account.balance || 0) + rewardAmount;
    const level = calculateLevel(newBalance);
    const nextSpeed = calculateMiningSpeed(level);

    // Atomic balance move: the update only applies if the balance is still
    // what we read. Two claims racing on the same balance can no longer
    // both credit the same minutes (same guard as the withdrawal route).
    const { data: updatedAccount, error: updateError } = await supabaseAdmin
      .from('mining_accounts')
      .update({
        balance: newBalance,
        level,
        mining_speed: nextSpeed,
        last_claim_at: now.toISOString(),
      })
      .eq('id', account.id)
      .eq('balance', account.balance)
      .select('balance, mining_speed, level, last_claim_at, mining_active')
      .single();

    if (updateError || !updatedAccount) {
      return NextResponse.json({ error: 'Transaction collision, please try again' }, { status: 409 });
    }

    // Book the minted amount against this quarter's budget. Runs after the
    // account update on purpose: if the counter update fails, the user
    // keeps their (already credited) reward and the counter under-counts
    // slightly, instead of the reverse (quota eaten, user paid nothing).
    if (quarter.start && quarter.budget) {
      const booked = await incrementQuarterMinted(quarter.start, quarter.budget, rewardAmount);
      if (!booked) console.error('Claim: quarterly minted counter not updated for', account.id);
    }

    await creditFriendShare(user.id, rewardAmount, shareQuarterStart);

    const { data: claimRow, error: claimError } = await supabaseAdmin
      .from('mining_claims')
      .insert({ user_id: user.id, amount: rewardAmount })
      .select('id, amount, created_at')
      .single();

    if (claimError) {
      console.error('mining_claims insert failed:', claimError);
      return NextResponse.json({
        success: true,
        reward: rewardAmount,
        new_balance: Number(updatedAccount.balance || 0),
        claimSaved: false,
        claimError: claimError.message,
        emissionCapped,
      });
    }

    // First claim is one of the referral-valid gates (Frozen v1.0: Pass +
    // first claim + 7 days). The claim itself is the trigger that can
    // finally activate a pending referral — verify/start/mint only run
    // before the first claim exists, so without this call a referral could
    // stay pending forever.
    await activateReferralIfPending(user.id);

    return NextResponse.json({
      success: true,
      reward: rewardAmount,
      new_balance: Number(updatedAccount.balance || 0),
      last_claim_at: updatedAccount.last_claim_at,
      level: Number(updatedAccount.level || level),
      mining_speed: Number(updatedAccount.mining_speed || nextSpeed),
      claimSaved: true,
      claimId: claimRow.id,
      emissionCapped,
    });
  } catch (error) {
    console.error('Claim Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
