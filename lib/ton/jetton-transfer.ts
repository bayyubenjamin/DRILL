import { TonClient, WalletContractV4, internal, Address, beginCell } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

// Skrip ini idealnya dijalankan oleh cron job (misal: trigger via endpoint API internal setiap 1 menit)
export async function processWithdrawalQueue(withdrawalId: string, toAddress: string, amount: number) {
  try {
    const client = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.TONCENTER_API_KEY
    });

    // Treasury Wallet Setup
    const mnemonic = process.env.TON_TESTNET_MNEMONIC!.split(' ');
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const treasuryWallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    const contract = client.open(treasuryWallet);

    const treasuryJettonWalletAddress = Address.parse(process.env.TREASURY_JETTON_WALLET_ADDRESS!);
    const destinationAddress = Address.parse(toAddress);

    // Jetton decimals (contoh: 9 desimal)
    const jettonAmount = BigInt(amount * 10 ** 9);

    // Payload Transfer Jetton sesuai standar TEP-74
    const forwardPayload = beginCell()
      .storeUint(0, 32) // Teks op
      .storeStringTail("DRILL ENGINE Withdrawal")
      .endCell();

    const body = beginCell()
      .storeUint(0xf8a7ea5, 32)           // opcode for transfer
      .storeUint(0, 64)                   // query_id
      .storeCoins(jettonAmount)           // amount
      .storeAddress(destinationAddress)   // destination
      .storeAddress(treasuryWallet.address) // response_destination (sisa gas)
      .storeBit(0)                        // custom_payload (null)
      .storeCoins(BigInt("10000000"))     // forward_ton_amount (0.01 TON)
      .storeBit(1)                        // forward_payload (ada reference)
      .storeRef(forwardPayload)
      .endCell();

    const seqno = await contract.getSeqno();

    // Broadcast Transaksi
    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: treasuryJettonWalletAddress,
          value: '0.05', // Total TON yang dikirim untuk gas eksekusi kontrak Jetton
          bounce: true,
          body: body
        })
      ]
    });

    return { success: true, txHash: `pending_seqno_${seqno}` };
  } catch (error) {
    console.error('Jetton Transfer Error:', error);
    return { success: false, error };
  }
}
