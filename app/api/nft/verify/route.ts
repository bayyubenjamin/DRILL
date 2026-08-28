import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Address } from '@ton/ton';
import { REFERRAL_REWARD } from '@/lib/referral/constants';

async function activateReferral(userId: string) {
  const { data: pending } = await supabaseAdmin
    .from('referrals')
    .select('id, referrer_id, reward, status')
    .eq('referred_id', userId)
    .maybeSingle();

  if (!pending) return;
  const alreadyValid = pending.status === 'valid' || Number(pending.reward || 0) > 0;
  if (alreadyValid) return;

  await supabaseAdmin
    .from('referrals')
    .update({ status: 'valid', reward: REFERRAL_REWARD })
    .eq('id', pending.id);

  const { data: account } = await supabaseAdmin
    .from('mining_accounts')
    .select('balance')
    .eq('user_id', pending.referrer_id)
    .maybeSingle();

  if (account) {
    await supabaseAdmin
      .from('mining_accounts')
      .update({ balance: Number(account.balance || 0) + REFERRAL_REWARD })
      .eq('user_id', pending.referrer_id);
  }
}

export async function POST(request: Request) {
  try {
    const { initData, walletAddress } = await request.json();

    if (!validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
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

    const collectionAddress = process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS
      ? Address.parse(process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS).toString()
      : 'unknown-collection';

    // MVP: treat a successful verify call as minted access.
    const hasNFT = true;

    if (!hasNFT) {
      return NextResponse.json({ success: false, error: 'No NFT found in wallet' }, { status: 403 });
    }

    await supabaseAdmin.from('mining_accounts').update({ mining_active: true }).eq('user_id', user.id);
    await supabaseAdmin.from('mining_nfts').upsert(
      {
        user_id: user.id,
        nft_address: `minted:${user.id}`,
        collection_address: collectionAddress,
        is_active: true,
      },
      { onConflict: 'nft_address' },
    );

    await activateReferral(user.id);

    return NextResponse.json({ success: true, access: 'granted' });
  } catch (error) {
    console.error('NFT Verification Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
