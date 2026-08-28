import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hasOnchainPass } from '@/lib/ton/pass';
import { activateReferralIfPending } from '@/lib/referral/activate';

export async function POST(request: Request) {
  try {
    const { initData, walletAddress } = await request.json();
    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    if (!walletAddress) {
      return NextResponse.json({ success: true, hasNft: false, access: 'denied' });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    await supabaseAdmin.from('users').update({ wallet_address: walletAddress }).eq('telegram_user_id', tgUser.id);

    const hasNft = await hasOnchainPass(walletAddress);
    if (hasNft) {
      const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
      if (user) await activateReferralIfPending(user.id);
    }

    return NextResponse.json({ success: true, hasNft, access: hasNft ? 'granted' : 'denied' });
  } catch (error) {
    console.error('NFT Verification Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
