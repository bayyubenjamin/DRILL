import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/utils/telegram';
import { supabaseAdmin } from '@/lib/supabase/server';
import { TonClient, Address, TupleBuilder } from '@ton/ton';

export async function POST(request: Request) {
  try {
    const { initData, walletAddress } = await request.json();

    if (!validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const tgUser = JSON.parse(new URLSearchParams(initData).get('user')!);
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_user_id', tgUser.id).single();
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Inisialisasi TON Client untuk Testnet
    const client = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.TONCENTER_API_KEY // Opsional, tapi direkomendasikan
    });

    const collectionAddress = Address.parse(process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS!);
    const ownerAddress = Address.parse(walletAddress);

    // CATATAN: Untuk query NFT berdasarkan owner di TON secara native tanpa indexer (seperti TonAPI),
    // kita harus memverifikasi apakah wallet ini memegang NFT dari koleksi tersebut.
    // Dalam implementasi MVP ini, kita mensimulasikan pemanggilan smart contract sederhana.
    // Untuk production, sangat disarankan menggunakan TonAPI: https://testnet.tonapi.io/v2/accounts/{address}/nfts
    
    // Update alamat dompet ke tabel user
    await supabaseAdmin.from('users').update({ wallet_address: walletAddress }).eq('id', user.id);

    // Mock verifikasi kepemilikan untuk MVP Testnet (Ganti dengan integrasi TonAPI untuk query NFT yang akurat)
    const hasNFT = true; // Ganti dengan logika get_nft_data atau API Call

    if (hasNFT) {
      // Aktifkan mining
      await supabaseAdmin.from('mining_accounts').update({ mining_active: true }).eq('user_id', user.id);
      
      // Catat NFT (upsert)
      await supabaseAdmin.from('mining_nfts').upsert({
        user_id: user.id,
        nft_address: 'mock_nft_address_for_mvp', // Ganti dengan alamat NFT item sebenarnya
        collection_address: collectionAddress.toString(),
        is_active: true
      }, { onConflict: 'nft_address' });

      return NextResponse.json({ success: true, access: 'granted' });
    } else {
      return NextResponse.json({ success: false, error: 'No NFT found in wallet' }, { status: 403 });
    }

  } catch (error) {
    console.error('NFT Verification Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
