import { resolveTonConnectManifestUrl } from '@/lib/site';

export const TONCONNECT_MANIFEST_URL = resolveTonConnectManifestUrl();

export const TON_NETWORK =
  process.env.NEXT_PUBLIC_TON_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
