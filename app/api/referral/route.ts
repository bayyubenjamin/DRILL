import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { FRIEND_SHARE, REFERRAL_REWARD } from '@/lib/referral/constants';

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
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('id, reward, status, referred_id')
      .eq('referrer_id', user.id);
    if (error) throw error;

    const rows = (referrals || []).map((row) => ({ ...row, status: resolveStatus(row) }));
    const pending = rows.filter((row) => row.status === 'pending');
    const valid = rows.filter((row) => row.status === 'valid');

    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('balance, valid_ref_pool, friend_pool')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      totalInvites: rows.length,
      pendingCount: pending.length,
      validCount: valid.length,
      validReward: REFERRAL_REWARD,
      friendShare: FRIEND_SHARE,
      validPool: Number(account?.valid_ref_pool || 0),
      friendPool: Number(account?.friend_pool || 0),
      engineBalance: Number(account?.balance || 0),
      referrals: rows,
    });
  } catch (error) {
    console.error('Referral list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
