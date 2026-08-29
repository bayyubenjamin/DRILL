import { Address, beginCell, toNano } from '@ton/core';
import { DRILL_PASS_COLLECTION } from '@/lib/ton/network';

export const BUY_PASS_OPCODE = 0x42555950;
export const MINT_PRICE_NANOTON = toNano('1');
export const MINT_SEND_NANOTON = toNano('1.15');

const TONAPI = 'https://testnet.tonapi.io/v2';
const TONCENTER = 'https://testnet.toncenter.com/api/v2/runGetMethod';

function walletForms(walletAddress: string) {
  try {
    const parsed = Address.parse(walletAddress);
    return [parsed.toString(), parsed.toRawString(), walletAddress];
  } catch {
    return [walletAddress];
  }
}

function collectionForms() {
  try {
    const parsed = Address.parse(DRILL_PASS_COLLECTION);
    return [parsed.toString(), parsed.toRawString(), DRILL_PASS_COLLECTION];
  } catch {
    return [DRILL_PASS_COLLECTION];
  }
}

function stackHasIndex(stack: unknown): boolean {
  if (!Array.isArray(stack) || stack.length === 0) return false;
  const top = stack[0] as { type?: string; value?: string };
  if (!top || top.type === 'null') return false;
  if (top.type === 'num' || top.type === 'int' || top.type === 'tinyint') return true;
  if (typeof top.value === 'string' && top.value !== '' && top.value !== 'null') return true;
  return false;
}

async function hasPassViaNftIndex(walletAddress: string) {
  const owners = walletForms(walletAddress);
  const collections = collectionForms();

  for (const owner of owners) {
    for (const collection of collections) {
      const url = `${TONAPI}/accounts/${encodeURIComponent(owner)}/nfts?collection=${encodeURIComponent(collection)}&limit=10`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      const items = data?.nft_items || data?.nfts || [];
      if (Array.isArray(items) && items.length > 0) return true;
    }
  }
  return false;
}

async function hasPassViaGetMethod(walletAddress: string) {
  const parsed = Address.parse(walletAddress);
  const friendly = parsed.toString();
  const collection = collectionForms()[0];

  const attempts: Array<() => Promise<boolean>> = [
    async () => {
      const res = await fetch(`${TONAPI}/blockchain/accounts/${encodeURIComponent(collection)}/methods/passIndexOf?args=${encodeURIComponent(friendly)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      return Boolean(data?.success) && data?.exit_code === 0 && stackHasIndex(data?.stack);
    },
    async () => {
      const res = await fetch(`${TONAPI}/blockchain/accounts/${encodeURIComponent(collection)}/methods/passIndexOf`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ args: [friendly] }),
        cache: 'no-store',
      });
      const data = await res.json();
      return Boolean(data?.success) && data?.exit_code === 0 && stackHasIndex(data?.stack);
    },
    async () => {
      const sliceBoc = beginCell().storeAddress(parsed).endCell().toBoc().toString('base64');
      const res = await fetch(TONCENTER, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          address: collection,
          method: 'passIndexOf',
          stack: [['tvm.Slice', sliceBoc]],
        }),
        cache: 'no-store',
      });
      const data = await res.json();
      if (!data?.ok || data?.result?.exit_code !== 0) return false;
      const top = data.result.stack?.[0];
      return Array.isArray(top) && top[0] !== 'null' && top[1] !== null;
    },
  ];

  for (const attempt of attempts) {
    try {
      if (await attempt()) return true;
    } catch (error) {
      console.error('pass get-method attempt failed:', error);
    }
  }

  return false;
}

export async function hasOnchainPass(walletAddress: string) {
  if (!walletAddress) return false;
  try {
    if (await hasPassViaNftIndex(walletAddress)) return true;
    return await hasPassViaGetMethod(walletAddress);
  } catch (error) {
    console.error('on-chain pass check failed:', error);
    return false;
  }
}

export async function waitForOnchainPass(walletAddress: string, attempts = 8, delayMs = 3000) {
  for (let i = 0; i < attempts; i += 1) {
    if (await hasOnchainPass(walletAddress)) return true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

export function buyPassPayloadBase64(queryId = BigInt(0)) {
  return beginCell().storeUint(BUY_PASS_OPCODE, 32).storeUint(queryId, 64).endCell().toBoc().toString('base64');
}
