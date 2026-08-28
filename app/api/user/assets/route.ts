import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed, getLevelProgress } from '@/lib/level/calculator';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();
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

    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('balance, mining_speed, last_claim_at, mining_active')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: withdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('id, amount, fee, receive_amount, status, created_at, wallet_address')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const walletBalance = (withdrawals || [])
      .filter((row) => !['FAILED', 'REJECTED', 'CANCELLED'].includes(String(row.status || '').toUpperCase()))
      .reduce((sum, row) => sum + Number(row.receive_amount || 0), 0);

    const engineBalance = Number(account?.balance || 0);
    const miningActive = Boolean(account?.mining_active);
    const lastClaimAt = account?.last_claim_at || null;
    const miningSpeed = miningActive ? Number(account?.mining_speed || 0) : 0;

    return NextResponse.json({
      success: true,
      walletAddress: user.wallet_address || null,
      walletBalance,
      engineBalance,
      miningActive,
      miningSpeed,
      lastClaimAt,
      withdrawals: withdrawals || [],
    });
  } catch (error) {
    console.error('Assets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
