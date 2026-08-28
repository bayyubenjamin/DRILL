import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { initData, referrerTgId } = await request.json();
    if (!initData || !referrerTgId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }
    if (!validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    if (String(tgUser.id) === String(referrerTgId)) {
      return NextResponse.json({ success: false, error: 'Cannot refer yourself' });
    }

    const { data: referred } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
    const { data: referrer } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', Number(referrerTgId)).maybeSingle();
    if (!referred || !referrer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existing } = await supabaseAdmin
      .from('referrals')
      .select('id, status')
      .eq('referred_id', referred.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ success: true, alreadyBound: true, status: existing.status || 'pending' });
    }

    const { error } = await supabaseAdmin.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id: referred.id,
      reward: 0,
      status: 'pending',
    });
    if (error && error.code !== '23505') throw error;

    return NextResponse.json({ success: true, status: 'pending', reward: 0 });
  } catch (error) {
    console.error('Referral apply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
