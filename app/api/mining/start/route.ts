import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed } from '@/lib/level/calculator';
import { hasOnchainPass } from '@/lib/ton/pass';
import { DRILL_PASS_COLLECTION } from '@/lib/ton/network';

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

    await supabaseAdmin.from('mining_nfts').upsert(
      {
        user_id: user.id,
        nft_address: `sbt:${walletAddress}`,
        collection_address: DRILL_PASS_COLLECTION,
        is_active: true,
      },
      { onConflict: 'nft_address' },
    );

    let { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('id, balance, mining_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!account) {
      const { data: created } = await supabaseAdmin
        .from('mining_accounts')
        .insert({ user_id: user.id, balance: 0, mining_speed: 0.5, level: 1, mining_active: false })
        .select('id, balance, mining_active')
        .single();
      account = created;
    }
    if (!account) return NextResponse.json({ error: 'Mining account not found' }, { status: 404 });
    if (account.mining_active) {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    const level = calculateLevel(Number(account.balance || 0));
    const speed = calculateMiningSpeed(level);
    const now = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('mining_accounts')
      .update({ mining_active: true, mining_speed: speed, level, last_claim_at: now })
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
        unclaimed: 0,
      },
    });
  } catch (error) {
    console.error('Mining start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
