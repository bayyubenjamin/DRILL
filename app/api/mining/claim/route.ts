import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { applyHalvingPenaltyToSpeed } from '@/lib/mining/emission';
import { calculateLevel, calculateMiningSpeed } from '@/lib/level/calculator';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();
    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: nft } = await supabaseAdmin
      .from('mining_nfts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!nft) return NextResponse.json({ error: 'Mining NFT required' }, { status: 403 });

    const { data: account, error: accountError } = await supabaseAdmin
      .from('mining_accounts')
      .select('id, balance, mining_speed, last_claim_at, mining_active')
      .eq('user_id', user.id)
      .maybeSingle();
    if (accountError || !account) {
      return NextResponse.json({ error: 'Mining account not found' }, { status: 404 });
    }
    if (!account.mining_active) {
      return NextResponse.json({ error: 'Mining is not active' }, { status: 403 });
    }

    const now = new Date();
    const lastClaimAt = account.last_claim_at ? new Date(account.last_claim_at) : now;
    const elapsedMinutes = Math.max(0, (now.getTime() - lastClaimAt.getTime()) / 60000);
    const genesisStartSec = Number(process.env.GENESIS_START_TIMESTAMP || 0);
    const actualMiningSpeed = applyHalvingPenaltyToSpeed(Number(account.mining_speed || 0), genesisStartSec);
    const rewardAmount = actualMiningSpeed * elapsedMinutes;
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
      .eq('last_claim_at', account.last_claim_at)
      .select('balance, mining_speed, level, last_claim_at, mining_active')
      .single();

    if (updateError || !updatedAccount) {
      return NextResponse.json({ error: 'Claim collision detected. Try again.' }, { status: 409 });
    }

    void supabaseAdmin.from('mining_claims').insert({
      user_id: user.id,
      amount: rewardAmount,
    });

    return NextResponse.json({
      success: true,
      reward: rewardAmount,
      new_balance: Number(updatedAccount.balance || 0),
      last_claim_at: updatedAccount.last_claim_at,
      level: Number(updatedAccount.level || level),
      mining_speed: Number(updatedAccount.mining_speed || nextSpeed),
    });
  } catch (error) {
    console.error('Claim Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
