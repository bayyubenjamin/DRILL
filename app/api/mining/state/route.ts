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
        account: { balance: 0, miningSpeed: 0, level: 1, lastClaimAt: null, miningActive: false, progressPercent: 0 },
      });
    }

    const hasNft = await hasOnchainPass(walletAddress);
    if (!hasNft) {
      return NextResponse.json({
        success: true,
        hasNft: false,
        walletAddress,
        account: { balance: 0, miningSpeed: 0, level: 1, lastClaimAt: null, miningActive: false, progressPercent: 0 },
      });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('balance, last_claim_at, mining_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!account) {
      const { data: created } = await supabaseAdmin
        .from('mining_accounts')
        .insert({ user_id: user.id, balance: 0, mining_speed: 0, level: 1, mining_active: false })
        .select('balance, last_claim_at, mining_active')
        .single();
      account = created;
    }

    const balance = Number(account?.balance || 0);
    const level = calculateLevel(balance);
    const miningActive = Boolean(account?.mining_active);
    const speed = miningActive ? calculateMiningSpeed(level) : 0;
    const progress = getLevelProgress(balance);

    return NextResponse.json({
      success: true,
      hasNft: true,
      walletAddress,
      account: {
        balance,
        miningSpeed: speed,
        level,
        lastClaimAt: miningActive ? account?.last_claim_at || null : null,
        miningActive,
        progressPercent: progress.progressPercent,
      },
    });
  } catch (error) {
    console.error('Mining state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
