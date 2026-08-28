import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
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
    if (!nft) {
      return NextResponse.json({ error: 'Mining NFT required' }, { status: 403 });
    }

    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('id, balance, mining_active')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!account) return NextResponse.json({ error: 'Mining account not found' }, { status: 404 });
    if (account.mining_active) {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    const level = calculateLevel(Number(account.balance || 0));
    const speed = calculateMiningSpeed(level);
    const now = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('mining_accounts')
      .update({
        mining_active: true,
        mining_speed: speed,
        level,
        last_claim_at: now,
      })
      .eq('id', account.id)
      .select('balance, mining_speed, level, last_claim_at, mining_active')
      .single();

    if (error || !updated) throw error;

    return NextResponse.json({
      success: true,
      account: {
        balance: Number(updated.balance || 0),
        miningSpeed: Number(updated.mining_speed || 0),
        level: Number(updated.level || 1),
        lastClaimAt: updated.last_claim_at,
        miningActive: true,
      },
    });
  } catch (error) {
    console.error('Mining start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
