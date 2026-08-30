import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hasOnchainPass } from '@/lib/ton/pass';
import { activateReferralIfPending } from '@/lib/referral/activate';
import { bindWalletToUser } from '@/lib/user/wallet-bind';

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
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const bound = await bindWalletToUser(user.id, walletAddress);
    if (!bound.ok) {
      return NextResponse.json(
        { success: false, hasNft: false, access: 'denied', error: bound.error, code: bound.code },
        { status: 409 },
      );
    }

    const hasNft = await hasOnchainPass(bound.wallet);
    if (hasNft) await activateReferralIfPending(user.id);

    return NextResponse.json({ success: true, hasNft, access: hasNft ? 'granted' : 'denied' });
  } catch (error) {
    console.error('NFT Verification Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
