import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';

const MIN_WITHDRAW = 500;
const WITHDRAW_FEE = 70;

export async function POST(request: Request) {
  try {
    const { initData, amount, walletAddress } = await request.json();
    const withdrawAmount = Number(amount);

    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    if (!walletAddress) {
      return NextResponse.json({ error: 'Connect wallet first' }, { status: 400 });
    }
    if (Number.isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAW) {
      return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAW} $DRILL` }, { status: 400 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('id, balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!account || Number(account.balance) < withdrawAmount) {
      return NextResponse.json({ error: 'Insufficient engine balance' }, { status: 400 });
    }

    const receiveAmount = withdrawAmount - WITHDRAW_FEE;
    const newBalance = Number(account.balance) - withdrawAmount;

    const { error: updateError } = await supabaseAdmin
      .from('mining_accounts')
      .update({ balance: newBalance })
      .eq('id', account.id)
      .eq('balance', account.balance);

    if (updateError) {
      return NextResponse.json({ error: 'Transaction collision, please try again' }, { status: 409 });
    }

    const { data: withdrawalRecord, error: insertError } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        amount: withdrawAmount,
        fee: WITHDRAW_FEE,
        receive_amount: receiveAmount,
        status: 'QUEUED',
      })
      .select('id')
      .single();

    if (insertError) {
      await supabaseAdmin.from('mining_accounts').update({ balance: account.balance }).eq('id', account.id);
      return NextResponse.json({ error: 'Failed to queue withdrawal' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      queueId: withdrawalRecord.id,
      receiveAmount,
      fee: WITHDRAW_FEE,
      newEngineBalance: newBalance,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
