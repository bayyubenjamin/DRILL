import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sameTonAddress } from '@/lib/user/wallet-bind';

const MIN_WITHDRAW = 500;
const WITHDRAW_FEE = 70;
// Frozen v1.0 §1: max 5,000 DRILL withdrawn per user per day. Window is a
// rolling 24h, same as the cooldown below — a calendar day would let a
// user take 5,000 at 23:59 and another 5,000 at 00:01.
const MAX_WITHDRAW_PER_DAY = 5000;
// Withdrawal cooldown — owner rule, 27 Nov 2026 (amendment on top of
// Frozen v1.0): at most 1 withdrawal per 24h per user. The clock starts at
// the last withdrawal that actually went through; FAILED / REJECTED /
// CANCELLED ones never start it — the user got nothing from those.
const WITHDRAW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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
    if (withdrawAmount > MAX_WITHDRAW_PER_DAY) {
      return NextResponse.json(
        { error: `Maximum withdrawal is ${MAX_WITHDRAW_PER_DAY} $DRILL per day` },
        { status: 400 },
      );
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Frozen v1.0 §5: the destination is forced to the wallet bound in the
    // database, never taken from the request body. The body address is only
    // used to prove the user connected that same wallet (sameTonAddress
    // handles the different TON address formats).
    if (!user.wallet_address) {
      return NextResponse.json(
        { error: 'Bind a wallet first — verify your Drill Pass, then withdraw' },
        { status: 400 },
      );
    }
    if (!sameTonAddress(user.wallet_address, walletAddress)) {
      return NextResponse.json(
        {
          error: `Withdrawals go to your bound wallet ${user.wallet_address} — connect that wallet`,
          boundWallet: user.wallet_address,
        },
        { status: 403 },
      );
    }
    const boundWallet = user.wallet_address;

    // 1 withdrawal per 24h — enforced server-side, never trust the client.
    const { data: lastWd, error: lastWdError } = await supabaseAdmin
      .from('withdrawals')
      .select('created_at')
      .eq('user_id', user.id)
      .not('status', 'in', '("FAILED","REJECTED","CANCELLED")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastWdError) console.error('Cooldown lookup error:', lastWdError);
    if (lastWd?.created_at) {
      const nextAt = new Date(lastWd.created_at).getTime() + WITHDRAW_COOLDOWN_MS;
      const remainingMs = nextAt - Date.now();
      if (remainingMs > 0) {
        return NextResponse.json(
          {
            error: 'Withdrawal cooldown active — 1 withdrawal per 24 hours',
            nextWithdrawAt: new Date(nextAt).toISOString(),
            remainingSeconds: Math.ceil(remainingMs / 1000),
          },
          { status: 429 },
        );
      }
    }

    // Daily cap — same rolling 24h window and same status exemptions as
    // the cooldown. With the 1x/24h cooldown this is normally a single
    // withdrawal, but the sum check keeps the cap true even if the
    // cooldown rule is ever relaxed.
    const { data: recentWds, error: recentWdsError } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('user_id', user.id)
      .not('status', 'in', '("FAILED","REJECTED","CANCELLED")')
      .gte('created_at', new Date(Date.now() - WITHDRAW_COOLDOWN_MS).toISOString());
    if (recentWdsError) console.error('Daily cap lookup error:', recentWdsError);
    const withdrawnToday = (recentWds || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    if (withdrawnToday + withdrawAmount > MAX_WITHDRAW_PER_DAY) {
      return NextResponse.json(
        {
          error: `Daily withdrawal limit is ${MAX_WITHDRAW_PER_DAY} $DRILL`,
          dailyRemaining: Math.max(0, MAX_WITHDRAW_PER_DAY - withdrawnToday),
        },
        { status: 429 },
      );
    }

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
        wallet_address: boundWallet,
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
