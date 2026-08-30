import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed } from '@/lib/level/calculator';
import { TASK_REWARD, TASK_WAIT_MS } from '@/lib/tasks/constants';

function detail(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: string }).message);
  return error instanceof Error ? error.message : 'Internal server error';
}

export async function POST(request: Request) {
  try {
    const { initData, taskId } = await request.json();
    if (!validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    if (!taskId) return NextResponse.json({ error: 'Missing task' }, { status: 400 });

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: task } = await supabaseAdmin.from('tasks').select('*').eq('id', taskId).maybeSingle();
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const { data: progress } = await supabaseAdmin
      .from('user_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle();

    if (!progress) return NextResponse.json({ error: 'Open the task link first' }, { status: 400 });
    if (progress.status === 'completed' || progress.claimed_at) {
      return NextResponse.json({ error: 'Task already claimed' }, { status: 409 });
    }

    const startedAt = progress.started_at || progress.created_at;
    if (!startedAt) return NextResponse.json({ error: 'Open the task link first' }, { status: 400 });
    const elapsed = Date.now() - new Date(startedAt).getTime();
    if (elapsed < TASK_WAIT_MS) {
      return NextResponse.json({ error: 'Wait before claiming', remainingMs: TASK_WAIT_MS - elapsed }, { status: 429 });
    }

    const claimedAt = new Date().toISOString();
    let updated = await supabaseAdmin
      .from('user_tasks')
      .update({ status: 'completed', claimed_at: claimedAt })
      .eq('id', progress.id);
    if (updated.error) {
      updated = await supabaseAdmin.from('user_tasks').update({ status: 'completed' }).eq('id', progress.id);
    }
    if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 500 });

    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();
    const newBalance = Number(account?.balance || 0) + TASK_REWARD;
    const level = calculateLevel(newBalance);
    const speed = calculateMiningSpeed(level);

    const { data: updatedAccount, error: balanceError } = await supabaseAdmin
      .from('mining_accounts')
      .update({ balance: newBalance, level, mining_speed: speed })
      .eq('user_id', user.id)
      .select('balance')
      .maybeSingle();
    if (balanceError) return NextResponse.json({ error: balanceError.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      reward: TASK_REWARD,
      new_balance: Number(updatedAccount?.balance || newBalance),
    });
  } catch (error) {
    console.error('Claim task error:', error);
    return NextResponse.json({ error: detail(error) }, { status: 500 });
  }
}
