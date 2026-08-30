import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { TASK_REWARD, TASK_WAIT_MS, isClaimedToday, isDailyTask } from '@/lib/tasks/constants';

function detail(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: string }).message);
  return error instanceof Error ? error.message : 'Internal server error';
}

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    if (!initData || !validateTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user') || '{}');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let tasksQuery = await supabaseAdmin.from('tasks').select('*').eq('is_active', true);
    if (tasksQuery.error) tasksQuery = await supabaseAdmin.from('tasks').select('*');
    if (tasksQuery.error) {
      return NextResponse.json({
        error: tasksQuery.error.message,
        hint: 'Run supabase/tasks.sql in the Supabase SQL editor',
      }, { status: 500 });
    }

    const progressQuery = await supabaseAdmin.from('user_tasks').select('*').eq('user_id', user.id);
    const progressRows = progressQuery.error ? [] : progressQuery.data || [];
    const progress = new Map(progressRows.map((row) => [String(row.task_id), row]));
    const now = Date.now();

    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    const tasks = (tasksQuery.data || []).map((task) => {
      const row = progress.get(String(task.id));
      const completed = isClaimedToday(row?.claimed_at, task.type) || (!isDailyTask(task.type) && row?.status === 'completed');
      const startedAtRaw = completed ? null : row?.started_at || null;
      const startedAt = startedAtRaw ? new Date(startedAtRaw).getTime() : null;
      const remainingMs = startedAt && !completed ? Math.max(0, TASK_WAIT_MS - (now - startedAt)) : TASK_WAIT_MS;
      return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        type: task.type || 'social',
        link: task.link || task.url || null,
        reward: TASK_REWARD,
        is_completed: completed,
        started: Boolean(startedAt) && !completed,
        started_at: startedAtRaw,
        can_claim: Boolean(startedAt) && !completed && remainingMs === 0,
        remaining_ms: completed ? 0 : startedAt ? remainingMs : TASK_WAIT_MS,
        resets_daily: isDailyTask(task.type),
      };
    });

    return NextResponse.json({
      success: true,
      tasks,
      waitMs: TASK_WAIT_MS,
      reward: TASK_REWARD,
      balance: Number(account?.balance || 0),
    });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: detail(error) }, { status: 500 });
  }
}
