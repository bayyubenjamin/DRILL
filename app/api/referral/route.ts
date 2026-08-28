import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';

function resolveStatus(row: { status?: string | null; reward?: number | string | null }) {
  if (row.status === 'valid' || row.status === 'pending') return row.status;
  return Number(row.reward || 0) > 0 ? 'valid' : 'pending';
}

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    if (!validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('id, reward, status, referred_id')
      .eq('referrer_id', user.id);

    if (error) throw error;

    const rows = (referrals || []).map((row) => ({
      ...row,
      status: resolveStatus(row),
    }));

    const pending = rows.filter((row) => row.status === 'pending');
    const valid = rows.filter((row) => row.status === 'valid');
    const totalEarned = valid.reduce((sum, row) => sum + Number(row.reward || 0), 0);

    return NextResponse.json({
      success: true,
      totalInvites: rows.length,
      pendingCount: pending.length,
      validCount: valid.length,
      totalEarned,
      referrals: rows,
    });
  } catch (error) {
    console.error('Referral list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
