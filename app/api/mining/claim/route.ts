import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed } from '@/lib/level/calculator';
import { hasOnchainPass } from '@/lib/ton/pass';

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
    const elapsedMinutes = Math.max(0, (now.getTime() - lastClaimAt.getTime()) / 60000);
    const speed = Number(account.mining_speed || 0);
    const rewardAmount = Number((speed * elapsedMinutes).toFixed(8));
    if (rewardAmount <= 0) {
      return NextResponse.json({ error: 'Nothing to claim yet' }, { status: 400 });
    }

    const newBalance = Number(account.balance || 0) + rewardAmount;
    const level = calculateLevel(newBalance);
    const nextSpeed = calculateMiningSpeed(level);

    const { data: updatedAccount, error: updateError } = await supabaseAdmin
      .from('mining_accounts')
      .update({
        balance: newBalance,
        level,
        mining_speed: nextSpeed,
        last_claim_at: now.toISOString(),
      })
      .eq('id', account.id)
      .select('balance, mining_speed, level, last_claim_at, mining_active')
      .single();

    if (updateError || !updatedAccount) {
      return NextResponse.json({ error: 'Claim failed. Try again.' }, { status: 409 });
    }

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
      });
    }

    return NextResponse.json({
      success: true,
      reward: rewardAmount,
      new_balance: Number(updatedAccount.balance || 0),
      last_claim_at: updatedAccount.last_claim_at,
      level: Number(updatedAccount.level || level),
      mining_speed: Number(updatedAccount.mining_speed || nextSpeed),
      claimSaved: true,
      claimId: claimRow.id,
    });
  } catch (error) {
    console.error('Claim Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
