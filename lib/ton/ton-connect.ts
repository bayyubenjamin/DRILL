export const TONCONNECT_MANIFEST_URL =
  process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL ??
  'https://drill-chi-flax.vercel.app/tonconnect-manifest.json';

export const TON_NETWORK =
  process.env.NEXT_PUBLIC_TON_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
