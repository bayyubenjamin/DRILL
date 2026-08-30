import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { TASK_WAIT_MS } from '@/lib/tasks/constants';

function detail(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: string }).message);
  return error instanceof Error ? error.message : 'Internal server error';
}

export async function POST(request: Request) {
  try {
    const { initData, taskId } = await request.json();
    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    if (!taskId) return NextResponse.json({ error: 'Missing task' }, { status: 400 });

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: task } = await supabaseAdmin.from('tasks').select('*').eq('id', taskId).maybeSingle();
    if (!task) return NextResponse.json({ error: 'Task not found. Run supabase/tasks.sql' }, { status: 404 });

    const { data: existing } = await supabaseAdmin
      .from('user_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle();

    if (existing?.status === 'completed' || existing?.claimed_at) {
      return NextResponse.json({ success: true, started: false, completed: true, remainingMs: 0 });
    }

    const startedAt = existing?.started_at || new Date().toISOString();
    if (!existing) {
      const insert = await supabaseAdmin.from('user_tasks').insert({
        user_id: user.id,
        task_id: taskId,
        status: 'started',
        started_at: startedAt,
      });
      if (insert.error) {
        const fallback = await supabaseAdmin.from('user_tasks').insert({
          user_id: user.id,
          task_id: taskId,
          status: 'started',
        });
        if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
    }

    const remainingMs = Math.max(0, TASK_WAIT_MS - (Date.now() - new Date(startedAt).getTime()));
    return NextResponse.json({ success: true, started: true, completed: false, startedAt, remainingMs });
  } catch (error) {
    console.error('Start task error:', error);
    return NextResponse.json({ error: detail(error) }, { status: 500 });
  }
}
