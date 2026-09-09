export const TONCONNECT_MANIFEST_URL =
  process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL ??
  'https://drillprotocol.xyz/tonconnect-manifest.json';

export const TON_NETWORK =
  process.env.NEXT_PUBLIC_TON_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
