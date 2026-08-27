import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    if (!validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).single();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('reward')
      .eq('referrer_id', user.id);

    if (error) throw error;

    const totalInvites = referrals?.length || 0;
    const totalEarned = referrals?.reduce((sum, ref) => sum + Number(ref.reward), 0) || 0;

    return NextResponse.json({ success: true, totalInvites, totalEarned });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
