import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateMiningSpeed } from '@/lib/level/calculator';
import { hasOnchainPass } from '@/lib/ton/pass';

export async function POST(request: Request) {
  try {
    const { initData, walletAddress } = await request.json();
    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const owner = walletAddress || user.wallet_address;
    const hasNft = owner ? await hasOnchainPass(owner) : false;

    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('balance, last_claim_at, mining_active, mining_speed')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: withdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('id, amount, fee, receive_amount, status, created_at, wallet_address')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const engineBalance = hasNft ? Number(account?.balance || 0) : 0;
    const miningActive = hasNft && Boolean(account?.mining_active);
    const lastClaimAt = miningActive ? account?.last_claim_at || null : null;
    const miningSpeed = miningActive ? calculateMiningSpeed(Number(account?.mining_speed || 1)) || Number(account?.mining_speed || 0) : 0;

    return NextResponse.json({
      success: true,
      hasNft,
      walletAddress: owner || null,
      walletBalance: 0,
      engineBalance,
      miningActive,
      miningSpeed: miningActive ? Number(account?.mining_speed || 0.5) : 0,
      lastClaimAt,
      withdrawals: withdrawals || [],
    });
  } catch (error) {
    console.error('Assets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
