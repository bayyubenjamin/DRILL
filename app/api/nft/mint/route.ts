import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Address } from '@ton/core';
import { hasOnchainPass } from '@/lib/ton/pass';
import { DRILL_PASS_COLLECTION } from '@/lib/ton/network';
import { activateReferralIfPending } from '@/lib/referral/activate';
import { bindWalletToUser } from '@/lib/user/wallet-bind';

export async function POST(request: Request) {
  try {
    const { initData, walletAddress } = await request.json();
    if (!initData || !validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    if (!walletAddress) {
      return NextResponse.json({ error: 'Connect wallet first' }, { status: 400 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_user_id', tgUser.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const bound = await bindWalletToUser(user.id, walletAddress);
    if (!bound.ok) {
      return NextResponse.json({ success: false, error: bound.error, code: bound.code }, { status: 409 });
    }

    const confirmed = await hasOnchainPass(bound.wallet);
    if (!confirmed) {
      return NextResponse.json(
        { success: false, minted: false, hasNft: false, error: 'On-chain SBT not found yet' },
        { status: 409 },
      );
    }

    const collectionAddress = Address.parse(DRILL_PASS_COLLECTION).toString();
    const { data: existingNft } = await supabaseAdmin
      .from('mining_nfts')
      .select('user_id')
      .eq('nft_address', `sbt:${bound.wallet}`)
      .maybeSingle();
    if (existingNft && existingNft.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'This wallet is already bound to another Telegram account', code: 'WALLET_TAKEN' }, { status: 409 });
    }

    const { error: nftError } = await supabaseAdmin.from('mining_nfts').upsert(
      {
        user_id: user.id,
        nft_address: `sbt:${bound.wallet}`,
        collection_address: collectionAddress,
        is_active: true,
      },
      { onConflict: 'nft_address' },
    );
    if (nftError) throw nftError;

    await activateReferralIfPending(user.id);

    return NextResponse.json({ success: true, minted: true, hasNft: true });
  } catch (error) {
    console.error('NFT mint confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
