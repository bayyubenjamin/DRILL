import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { claimPool } from '@/lib/referral/pools';

export async function POST(request: Request) {
  try {
    const { initData, pool } = await request.json();
    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    if (pool !== 'valid' && pool !== 'friends') {
      return NextResponse.json({ error: 'Invalid pool' }, { status: 400 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const result = await claimPool(user.id, pool === 'valid' ? 'valid_ref_pool' : 'friend_pool');
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({
      success: true,
      pool,
      claimed: result.amount,
      new_balance: result.newBalance,
    });
  } catch (error) {
    console.error('Referral claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
