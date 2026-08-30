import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { TASK_REWARD, TASK_WAIT_MS } from '@/lib/tasks/constants';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    if (!initData || !validateTelegramWebAppData(initData, botToken)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user') || '{}');
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: activeTasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id, title, description, reward, type, link')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (tasksError) throw tasksError;

    const { data: userTasks } = await supabaseAdmin
      .from('user_tasks')
      .select('task_id, status, started_at, claimed_at')
      .eq('user_id', user.id);

    const progress = new Map((userTasks || []).map((row) => [row.task_id, row]));
    const now = Date.now();

    const { data: account } = await supabaseAdmin
      .from('mining_accounts')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    const tasks = (activeTasks || []).map((task) => {
      const row = progress.get(task.id);
      const startedAt = row?.started_at ? new Date(row.started_at).getTime() : null;
      const completed = row?.status === 'completed' || Boolean(row?.claimed_at);
      const remainingMs = startedAt && !completed ? Math.max(0, TASK_WAIT_MS - (now - startedAt)) : TASK_WAIT_MS;
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        link: task.link || null,
        reward: TASK_REWARD,
        is_completed: completed,
        started: Boolean(startedAt) && !completed,
        started_at: row?.started_at || null,
        can_claim: Boolean(startedAt) && !completed && remainingMs === 0,
        remaining_ms: completed ? 0 : startedAt ? remainingMs : TASK_WAIT_MS,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
