import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { applyHalvingPenaltyToSpeed } from '@/lib/mining/emission';

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const genesisStartSec = Number(process.env.GENESIS_START_TIMESTAMP);
    
    // 1. Validasi Keamanan Request (Anti-Spoofing)
    if (!validateTelegramWebAppData(initData, botToken!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Ekstrak Telegram ID
    const urlParams = new URLSearchParams(initData);
    const tgUser = JSON.parse(urlParams.get('user')!);
    const telegramId = tgUser.id;

    // 3. Ambil data user internal
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', telegramId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Ambil Mining Account State
    const { data: account, error: accountError } = await supabaseAdmin
      .from('mining_accounts')
      .select('id, balance, mining_speed, last_claim_at, mining_active')
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Mining account not found' }, { status: 404 });
    }

    if (!account.mining_active) {
      return NextResponse.json({ error: 'Mining is not active' }, { status: 403 });
    }

    // 5. Kalkulasi Elapsed Time & Reward
    const now = new Date();
    const lastClaimAt = new Date(account.last_claim_at);
    const elapsedMs = now.getTime() - lastClaimAt.getTime();
    
    // PERBAIKAN 1: Pindahkan konversi elapsedMinutes ke atas sebelum digunakan
    const elapsedMinutes = elapsedMs / 60000; 

    // Cegah claim spam jika belum ada 1 menit
    if (elapsedMinutes < 1) {
      return NextResponse.json({ error: 'Claim cooldown active' }, { status: 429 });
    }

    // PERBAIKAN 2: Hitung reward dengan speed aktual (halving), dan hapus deklarasi ganda
    const actualMiningSpeed = applyHalvingPenaltyToSpeed(account.mining_speed, genesisStartSec);
    const rewardAmount = actualMiningSpeed * elapsedMinutes;
    
    const newBalance = account.balance + rewardAmount;

    // 6. Atomic Update menggunakan Optimistic Concurrency Control
    const { data: updatedAccount, error: updateError } = await supabaseAdmin
      .from('mining_accounts')
      .update({
        balance: newBalance,
        last_claim_at: now.toISOString(),
      })
      .eq('id', account.id)
      .eq('last_claim_at', account.last_claim_at) 
      .select('balance, last_claim_at')
      .single();

    if (updateError || !updatedAccount) {
      return NextResponse.json({ error: 'Claim collision detected. Try again.' }, { status: 409 });
    }

    // 7. Catat ke History (Asynchronous, tidak memblokir response ke user)
    supabaseAdmin.from('mining_claims').insert({
      user_id: user.id,
      amount: rewardAmount
    }).then(); // Fire and forget

    return NextResponse.json({ 
      success: true, 
      reward: rewardAmount,
      new_balance: updatedAccount.balance,
      last_claim_at: updatedAccount.last_claim_at
    });

  } catch (error) {
    console.error('Claim Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
