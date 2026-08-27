import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed, getLevelProgress } from '@/lib/level/calculator';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!validateTelegramWebAppData(initData, botToken!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user')!);
    const telegramId = tgUser.id;

    // 1. Ambil User ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', telegramId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Ambil Account State
    const { data: account, error: accountError } = await supabaseAdmin
      .from('mining_accounts')
      .select('id, balance, level, mining_speed')
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Mining account not found' }, { status: 404 });
    }

    // 3. Hitung Level & Mining Speed terbaru secara presisi
    const calculatedLevel = calculateLevel(account.balance);
    const calculatedSpeed = calculateMiningSpeed(calculatedLevel);
    const progressInfo = getLevelProgress(account.balance);

    // 4. Update jika terjadi perubahan Level atau Mining Speed
    let isUpdated = false;
    if (calculatedLevel !== account.level || calculatedSpeed !== account.mining_speed) {
      const { error: updateError } = await supabaseAdmin
        .from('mining_accounts')
        .update({
          level: calculatedLevel,
          mining_speed: calculatedSpeed,
        })
        .eq('id', account.id);

      if (updateError) {
        throw updateError;
      }
      isUpdated = true;
    }

    return NextResponse.json({
      success: true,
      updated: isUpdated,
      balance: account.balance,
      level: calculatedLevel,
      mining_speed: calculatedSpeed,
      progress: progressInfo,
    });
  } catch (error) {
    console.error('Sync Level Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
