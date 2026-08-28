import { beginCell, toNano } from '@ton/core';
import { DRILL_PASS_COLLECTION } from '@/lib/ton/network';

export const BUY_PASS_OPCODE = 0x42555950;
export const MINT_PRICE_NANOTON = toNano('1');

const TONAPI = 'https://testnet.tonapi.io/v2';

export async function hasOnchainPass(walletAddress: string) {
  if (!walletAddress) return false;
  try {
    const collection = DRILL_PASS_COLLECTION;
    const res = await fetch(
      `${TONAPI}/blockchain/accounts/${collection}/methods/passIndexOf`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          args: [{ type: 'slice', value: walletAddress }],
        }),
        cache: 'no-store',
      },
    );
    const data = await res.json();
    if (!data?.success || data.exit_code !== 0) return false;
    const top = data.stack?.[0];
    if (!top || top.type === 'null') return false;
    return top.type === 'num';
  } catch (error) {
    console.error('on-chain pass check failed:', error);
    return false;
  }
}

export function buyPassPayloadBase64(queryId = BigInt(0)) {
  return beginCell().storeUint(BUY_PASS_OPCODE, 32).storeUint(queryId, 64).endCell().toBoc().toString('base64');
}
