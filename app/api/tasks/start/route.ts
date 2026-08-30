import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { TASK_WAIT_MS } from '@/lib/tasks/constants';

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

    const { data: task } = await supabaseAdmin.from('tasks').select('id, is_active').eq('id', taskId).maybeSingle();
    if (!task || task.is_active === false) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const { data: existing } = await supabaseAdmin
      .from('user_tasks')
      .select('status, started_at, claimed_at')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle();

    if (existing?.status === 'completed' || existing?.claimed_at) {
      return NextResponse.json({ success: true, started: false, completed: true, remainingMs: 0 });
    }

    const startedAt = existing?.started_at || new Date().toISOString();
    if (!existing) {
      const { error } = await supabaseAdmin.from('user_tasks').insert({
        user_id: user.id,
        task_id: taskId,
        status: 'started',
        started_at: startedAt,
      });
      if (error) throw error;
    }

    const remainingMs = Math.max(0, TASK_WAIT_MS - (Date.now() - new Date(startedAt).getTime()));
    return NextResponse.json({ success: true, started: true, completed: false, startedAt, remainingMs });
  } catch (error) {
    console.error('Start task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
