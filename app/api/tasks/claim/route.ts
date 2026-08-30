import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed } from '@/lib/level/calculator';
import { TASK_REWARD, TASK_WAIT_MS } from '@/lib/tasks/constants';

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

    const { data: task } = await supabaseAdmin.from('tasks').select('id, is_active').eq('id', taskId).maybeSingle();
    if (!task || task.is_active === false) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const { data: progress } = await supabaseAdmin
      .from('user_tasks')
      .select('id, status, started_at, claimed_at')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle();

    if (!progress?.started_at) {
      return NextResponse.json({ error: 'Open the task link first' }, { status: 400 });
    }
    if (progress.status === 'completed' || progress.claimed_at) {
      return NextResponse.json({ error: 'Task already claimed' }, { status: 409 });
    }

    const elapsed = Date.now() - new Date(progress.started_at).getTime();
    if (elapsed < TASK_WAIT_MS) {
      return NextResponse.json({
        error: 'Wait before claiming',
        remainingMs: TASK_WAIT_MS - elapsed,
      }, { status: 429 });
    }

    const { error: updateTaskError } = await supabaseAdmin
      .from('user_tasks')
      .update({ status: 'completed', claimed_at: new Date().toISOString() })
      .eq('id', progress.id)
      .is('claimed_at', null);
    if (updateTaskError) throw updateTaskError;

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
    if (balanceError) throw balanceError;

    return NextResponse.json({
      success: true,
      reward: TASK_REWARD,
      new_balance: Number(updatedAccount?.balance || newBalance),
    });
  } catch (error) {
    console.error('Claim task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
