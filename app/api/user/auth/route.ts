import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';

async function bindReferral(referredId: string, referredTgId: number, referrerTgId: string) {
  if (!referrerTgId || String(referrerTgId) === String(referredTgId)) return;
  const { data: referrer } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('telegram_user_id', Number(referrerTgId))
    .maybeSingle();
  if (!referrer) return;

  const { data: existing } = await supabaseAdmin
    .from('referrals')
    .select('id')
    .eq('referred_id', referredId)
    .maybeSingle();
  if (existing) return;

  await supabaseAdmin.from('referrals').insert({
    referrer_id: referrer.id,
    referred_id: referredId,
    reward: 0,
    status: 'pending',
  });
}

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();
    if (!initData) return NextResponse.json({ error: 'Missing initData' }, { status: 400 });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    if (!validateTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: 'Invalid Telegram data signature' }, { status: 401 });
    }

    const urlParams = new URLSearchParams(initData);
    const userString = urlParams.get('user');
    if (!userString) return NextResponse.json({ error: 'No user data found in initData' }, { status: 400 });

    const tgUser = JSON.parse(userString);
    const startParam = urlParams.get('start_param');
    const profile = {
      telegram_user_id: tgUser.id,
      username: tgUser.username || null,
      first_name: tgUser.first_name || null,
      last_name: tgUser.last_name || null,
    };

    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, telegram_user_id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (fetchError) throw fetchError;

    if (existingUser) {
      await supabaseAdmin.from('users').update(profile).eq('id', existingUser.id);
      if (startParam) await bindReferral(existingUser.id, tgUser.id, startParam);
      return NextResponse.json({ success: true, user: existingUser, isNew: false });
    }

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert(profile)
      .select('id, telegram_user_id')
      .single();
    if (createError) throw createError;

    const { error: miningError } = await supabaseAdmin.from('mining_accounts').insert({
      user_id: newUser.id,
      balance: 0,
      mining_speed: 0,
      level: 1,
      mining_active: false,
    });
    if (miningError && miningError.code !== '23505') throw miningError;

    if (startParam) await bindReferral(newUser.id, tgUser.id, startParam);
    return NextResponse.json({ success: true, user: newUser, isNew: true });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
