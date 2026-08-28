import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { initData, walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!initData || !validateTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: 'Invalid Telegram data signature' }, { status: 401 });
    }

    const userString = new URLSearchParams(initData).get('user');
    if (!userString) {
      return NextResponse.json({ error: 'No user data found in initData' }, { status: 400 });
    }

    const tgUser = JSON.parse(userString);
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, telegram_user_id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ wallet_address: walletAddress })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, userId: user.id, walletAddress });
  } catch (error) {
    console.error('Wallet sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
