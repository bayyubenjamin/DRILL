import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { bindWalletToUser } from '@/lib/user/wallet-bind';

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

    const bound = await bindWalletToUser(user.id, walletAddress);
    if (!bound.ok) {
      return NextResponse.json(
        { success: false, error: bound.error, code: bound.code, boundWallet: bound.boundWallet },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true, userId: user.id, walletAddress: bound.wallet });
  } catch (error) {
    console.error('Wallet sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
