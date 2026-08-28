import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { REFERRAL_REWARD } from '@/lib/referral/constants';

async function hasActiveNft(userId: string) {
  const { data } = await supabaseAdmin
    .from('mining_nfts')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  return Boolean(data);
}

export async function POST(request: Request) {
  try {
    const { initData, referrerTgId } = await request.json();

    if (!initData) return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    if (!referrerTgId) return NextResponse.json({ error: 'Missing referrerTgId' }, { status: 400 });
    if (!validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    if (String(tgUser.id) === String(referrerTgId)) {
      return NextResponse.json({ success: false, error: 'Cannot refer yourself' });
    }

    const { data: referred } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    const { data: referrer } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', Number(referrerTgId))
      .maybeSingle();

    if (!referred || !referrer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existing } = await supabaseAdmin
      .from('referrals')
      .select('id, status, reward')
      .eq('referred_id', referred.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, alreadyBound: true, status: existing.status || (Number(existing.reward) > 0 ? 'valid' : 'pending') });
    }

    const minted = await hasActiveNft(referred.id);
    const status = minted ? 'valid' : 'pending';
    const reward = minted ? REFERRAL_REWARD : 0;

    const { error: insertError } = await supabaseAdmin.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id: referred.id,
      reward,
      status,
    });

    if (insertError && insertError.code !== '23505') throw insertError;

    if (minted) {
      const { data: account } = await supabaseAdmin
        .from('mining_accounts')
        .select('balance')
        .eq('user_id', referrer.id)
        .maybeSingle();
      if (account) {
        await supabaseAdmin
          .from('mining_accounts')
          .update({ balance: Number(account.balance || 0) + REFERRAL_REWARD })
          .eq('user_id', referrer.id);
      }
    }

    return NextResponse.json({ success: true, status, reward });
  } catch (error) {
    console.error('Referral apply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
