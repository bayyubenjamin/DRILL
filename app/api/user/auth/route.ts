import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Validasi Keamanan HMAC Telegram
    const isValid = validateTelegramWebAppData(initData, botToken);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid Telegram data signature' }, { status: 401 });
    }

    // 2. Ekstrak Data User
    const urlParams = new URLSearchParams(initData);
    const userString = urlParams.get('user');
    if (!userString) {
      return NextResponse.json({ error: 'No user data found in initData' }, { status: 400 });
    }

    const tgUser = JSON.parse(userString);
    const telegramId = tgUser.id;

    // 3. Cek User di Supabase
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, telegram_user_id')
      .eq('telegram_user_id', telegramId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw fetchError;
    }

    if (existingUser) {
      // User sudah terdaftar, kembalikan datanya
      return NextResponse.json({ success: true, user: existingUser, isNew: false });
    }

    // 4. Registrasi User Baru secara Atomic
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        telegram_user_id: telegramId,
        username: tgUser.username || null,
        first_name: tgUser.first_name || null,
        last_name: tgUser.last_name || null,
      })
      .select('id')
      .single();

    if (createError) throw createError;

    // 5. Inisialisasi Mining Account
    const { error: miningError } = await supabaseAdmin
      .from('mining_accounts')
      .insert({
        user_id: newUser.id,
        balance: 0,
        mining_speed: 0,
        level: 1,
        mining_active: false
      });

    if (miningError) throw miningError;

    return NextResponse.json({ success: true, user: newUser, isNew: true });

  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
