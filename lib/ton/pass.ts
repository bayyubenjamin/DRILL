import { Address, beginCell, toNano } from '@ton/core';
import { DRILL_PASS_COLLECTION, TONAPI_BASE, TONCENTER_RUNGET } from '@/lib/ton/network';

export const BUY_PASS_OPCODE = 0x42555950;
export const MINT_PRICE_NANOTON = toNano(process.env.NEXT_PUBLIC_MINT_PRICE_TON || '1');
export const MINT_SEND_NANOTON = toNano(process.env.NEXT_PUBLIC_MINT_SEND_TON || '1.15');

const FETCH_MS = 3500;

function walletForms(walletAddress: string) {
  try {
    const parsed = Address.parse(walletAddress);
    return [parsed.toString(), parsed.toRawString()];
  } catch {
    return [walletAddress];
  }
}

function collectionForms() {
  try {
    const parsed = Address.parse(DRILL_PASS_COLLECTION);
    return [parsed.toString(), parsed.toRawString()];
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

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_MS),
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function hasPassViaNftIndex(walletAddress: string) {
  const owners = walletForms(walletAddress);
  const collections = collectionForms();
  const checks = owners.flatMap((owner) =>
    collections.map(async (collection) => {
      const url = `${TONAPI_BASE}/accounts/${encodeURIComponent(owner)}/nfts?collection=${encodeURIComponent(collection)}&limit=4`;
      const data = await fetchJson(url);
      const items = data?.nft_items || data?.nfts || [];
      return Array.isArray(items) && items.length > 0;
    }),
  );
  const results = await Promise.allSettled(checks);
  return results.some((result) => result.status === 'fulfilled' && result.value);
}

async function hasPassViaGetMethod(walletAddress: string) {
  const parsed = Address.parse(walletAddress);
  const friendly = parsed.toString();
  const collection = collectionForms()[0];

  const attempts: Array<() => Promise<boolean>> = [
    async () => {
      const data = await fetchJson(
        `${TONAPI_BASE}/blockchain/accounts/${encodeURIComponent(collection)}/methods/passIndexOf?args=${encodeURIComponent(friendly)}`,
      );
      return Boolean(data?.success) && data?.exit_code === 0 && stackHasIndex(data?.stack);
    },
    async () => {
      const data = await fetchJson(`${TONAPI_BASE}/blockchain/accounts/${encodeURIComponent(collection)}/methods/passIndexOf`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ args: [friendly] }),
      });
      return Boolean(data?.success) && data?.exit_code === 0 && stackHasIndex(data?.stack);
    },
    async () => {
      const sliceBoc = beginCell().storeAddress(parsed).endCell().toBoc().toString('base64');
      const data = await fetchJson(TONCENTER_RUNGET, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          address: collection,
          method: 'passIndexOf',
          stack: [['tvm.Slice', sliceBoc]],
        }),
      });
      if (!data?.ok || data?.result?.exit_code !== 0) return false;
      const top = data.result.stack?.[0];
      return Array.isArray(top) && top[0] !== 'null' && top[1] !== null;
    },
  ];

  const results = await Promise.allSettled(attempts.map((attempt) => attempt()));
  return results.some((result) => result.status === 'fulfilled' && result.value);
}

export async function hasOnchainPass(walletAddress: string) {
  if (!walletAddress) return false;
  try {
    const results = await Promise.allSettled([
      hasPassViaNftIndex(walletAddress),
      hasPassViaGetMethod(walletAddress),
    ]);
    return results.some((result) => result.status === 'fulfilled' && result.value);
  } catch (error) {
    console.error('on-chain pass check failed:', error);
    return false;
  }
}

export async function waitForOnchainPass(walletAddress: string, attempts = 6, delayMs = 1500) {
  for (let i = 0; i < attempts; i += 1) {
    if (await hasOnchainPass(walletAddress)) return true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

export function buyPassPayloadBase64(queryId = BigInt(0)) {
  return beginCell().storeUint(BUY_PASS_OPCODE, 32).storeUint(queryId, 64).endCell().toBoc().toString('base64');
}
