import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateLevel, calculateMiningSpeed } from '@/lib/level/calculator';

export async function POST(request: Request) {
  try {
    const { initData, taskId } = await request.json();

    if (!validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).single();
    
    // Validasi jika user tidak ditemukan di database
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ambil info reward dari task
    const { data: task } = await supabaseAdmin.from('tasks').select('reward').eq('id', taskId).single();
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // Insert ke user_tasks (akan gagal/error jika task_id dan user_id sudah ada karena UNIQUE constraint)
    const { error: insertError } = await supabaseAdmin.from('user_tasks').insert({
      user_id: user.id,
      task_id: taskId,
      status: 'completed'
    });

    if (insertError) {
      return NextResponse.json({ error: 'Task already claimed or invalid' }, { status: 409 });
    }

    // Update balance user secara atomic
    const { data: account } = await supabaseAdmin.from('mining_accounts').select('balance').eq('user_id', user.id).single();
    const newBalance = (account?.balance || 0) + Number(task.reward);
    
    const level = calculateLevel(newBalance);
    const speed = calculateMiningSpeed(level);

    const { data: updatedAccount } = await supabaseAdmin.from('mining_accounts').update({
      balance: newBalance,
      level: level,
      mining_speed: speed
    }).eq('user_id', user.id).select('balance').single();

    return NextResponse.json({ success: true, new_balance: updatedAccount?.balance, reward: task.reward });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
