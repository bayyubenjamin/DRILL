import { Address, beginCell, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';
import { DRILL_PASS_COLLECTION } from '@/lib/ton/network';

export const BUY_PASS_OPCODE = 0x42555950;
export const MINT_PRICE_NANOTON = toNano('1');

function client() {
  return new TonClient({
    endpoint: process.env.TONCENTER_ENDPOINT || 'https://testnet.tonhubapi.com/jsonRPC',
  });
}

export async function hasOnchainPass(walletAddress: string) {
  try {
    const owner = Address.parse(walletAddress);
    const collection = Address.parse(DRILL_PASS_COLLECTION);
    const res = await client().runMethod(collection, 'passIndexOf', [
      { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
    ]);
    if (res.stack.remaining === 0) return false;
    const idx = res.stack.readBigNumberOpt();
    return idx !== null;
  } catch (error) {
    console.error('on-chain pass check failed:', error);
    return false;
  }
}

export function buyPassPayloadBase64(queryId = BigInt(0)) {
  return beginCell().storeUint(BUY_PASS_OPCODE, 32).storeUint(queryId, 64).endCell().toBoc().toString('base64');
}
