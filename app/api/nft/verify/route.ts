import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { initData, walletAddress } = await request.json();
    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (walletAddress) {
      await supabaseAdmin.from('users').update({ wallet_address: walletAddress }).eq('id', user.id);
    }

    const { data: nft } = await supabaseAdmin
      .from('mining_nfts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      access: nft ? 'granted' : 'denied',
      hasNft: Boolean(nft),
    });
  } catch (error) {
    console.error('NFT Verification Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
