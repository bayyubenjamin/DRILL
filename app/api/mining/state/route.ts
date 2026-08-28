import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed, getLevelProgress } from '@/lib/level/calculator';

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
        walletAddress: null,
        account: {
          balance: 0,
          miningSpeed: 0,
          level: 1,
          lastClaimAt: null,
          miningActive: false,
          progressPercent: 0,
        },
      });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('balance, mining_speed, level, last_claim_at, mining_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!account) {
      const { data: created } = await supabaseAdmin
        .from('mining_accounts')
        .insert({
          user_id: user.id,
          balance: 0,
          mining_speed: 0,
          level: 1,
          mining_active: false,
        })
        .select('balance, mining_speed, level, last_claim_at, mining_active')
        .single();
      account = created;
    }

    const { data: nft } = await supabaseAdmin
      .from('mining_nfts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    const hasNft = Boolean(nft);
    const miningActive = hasNft && Boolean(account?.mining_active);
    const balance = hasNft ? Number(account?.balance || 0) : 0;
    const progress = getLevelProgress(balance);
    const level = calculateLevel(balance);
    const speed = miningActive ? calculateMiningSpeed(level) : 0;

    return NextResponse.json({
      success: true,
      hasNft,
      walletAddress: user.wallet_address || walletAddress,
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
