import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Address } from '@ton/core';
import { hasOnchainPass } from '@/lib/ton/pass';
import { DRILL_PASS_COLLECTION } from '@/lib/ton/network';
import { activateReferralIfPending } from '@/lib/referral/activate';

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

    await supabaseAdmin.from('users').update({ wallet_address: walletAddress }).eq('id', user.id);

    const confirmed = await hasOnchainPass(walletAddress);
    if (!confirmed) {
      return NextResponse.json(
        { success: false, minted: false, hasNft: false, error: 'On-chain SBT not found yet' },
        { status: 409 },
      );
    }

    const collectionAddress = Address.parse(DRILL_PASS_COLLECTION).toString();
    const { error: nftError } = await supabaseAdmin.from('mining_nfts').upsert(
      {
        user_id: user.id,
        nft_address: `sbt:${walletAddress}`,
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
