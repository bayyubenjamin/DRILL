import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    let telegramId: number | null = null;

    if (initData) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken && validateTelegramWebAppData(initData, botToken)) {
        const urlParams = new URLSearchParams(initData);
        const userObj = JSON.parse(urlParams.get('user') || '{}');
        telegramId = userObj.id || null;
      }
    }

    // 1. Fetch all active tasks
    const { data: activeTasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id, title, description, reward, type')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (tasksError) {
      throw tasksError;
    }

    let completedTaskIds: Set<string> = new Set();

    // 2. If user is authenticated, fetch completed task IDs
    if (telegramId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('telegram_user_id', telegramId)
        .single();

      if (user) {
        const { data: userTasks } = await supabaseAdmin
          .from('user_tasks')
          .select('task_id')
          .eq('user_id', user.id);

        if (userTasks) {
          userTasks.forEach((ut) => completedTaskIds.add(ut.task_id));
        }
      }
    }

    // 3. Map completion status
    const tasksWithStatus = (activeTasks || []).map((task) => ({
      ...task,
      is_completed: completedTaskIds.has(task.id),
    }));

    return NextResponse.json({
      success: true,
      tasks: tasksWithStatus,
    });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
