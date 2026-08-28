import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed, getLevelProgress } from '@/lib/level/calculator';
import { hasOnchainPass } from '@/lib/ton/pass';

export async function POST(request: Request) {
  try {
    const { initData, walletAddress } = await request.json();
    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    if (!walletAddress) {
      return NextResponse.json({
        success: true,
        hasNft: false,
        unclaimed: 0,
        account: { balance: 0, miningSpeed: 0, level: 1, lastClaimAt: null, miningActive: false, progressPercent: 0 },
      });
    }

    const hasNft = await hasOnchainPass(walletAddress);
    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('balance, mining_speed, last_claim_at, mining_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!account) {
      const { data: created } = await supabaseAdmin
        .from('mining_accounts')
        .insert({ user_id: user.id, balance: 0, mining_speed: 0, level: 1, mining_active: false })
        .select('balance, mining_speed, last_claim_at, mining_active')
        .single();
      account = created;
    }

    const engineBalance = Number(account?.balance || 0);
    const miningActive = hasNft && Boolean(account?.mining_active);
    const lastClaimAt = miningActive ? account?.last_claim_at || null : null;
    const level = calculateLevel(engineBalance);
    const speed = miningActive
      ? Number(account?.mining_speed || 0) || calculateMiningSpeed(level)
      : 0;
    const unclaimed =
      miningActive && lastClaimAt
        ? Math.max(0, (Date.now() - new Date(lastClaimAt).getTime()) / 60000) * speed
        : 0;

    return NextResponse.json({
      success: true,
      hasNft,
      walletAddress,
      unclaimed,
      account: {
        balance: engineBalance,
        miningSpeed: speed,
        level,
        lastClaimAt,
        miningActive,
        progressPercent: getLevelProgress(engineBalance).progressPercent,
      },
    });
  } catch (error) {
    console.error('Mining state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
