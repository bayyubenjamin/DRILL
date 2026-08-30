export const TON_TESTNET_CHAIN = '-3';
export const TON_MAINNET_CHAIN = '-239';

const rawNetwork = (process.env.NEXT_PUBLIC_TON_NETWORK || 'testnet').toLowerCase();
export const TON_NETWORK = rawNetwork === 'mainnet' ? 'mainnet' : 'testnet';
export const IS_MAINNET = TON_NETWORK === 'mainnet';

export const DRILL_JETTON_MASTER =
  process.env.NEXT_PUBLIC_DRILL_JETTON_MASTER ||
  'EQAEzspFZ0CyG8ITTUAOrWLN9nbkmENgp0Dq6jaXxcee8Pyy';

export const DRILL_PASS_COLLECTION =
  process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS ||
  'EQB9hdar2ubsxlYXWZYkp2uCTeJQrYh8rzrKx5sBnlK8RZjF';

export const TONAPI_BASE = IS_MAINNET
  ? 'https://tonapi.io/v2'
  : 'https://testnet.tonapi.io/v2';

export const TONCENTER_RUNGET = IS_MAINNET
  ? 'https://toncenter.com/api/v2/runGetMethod'
  : 'https://testnet.toncenter.com/api/v2/runGetMethod';

export function explorerAccountUrl(address: string) {
  return IS_MAINNET
    ? `https://tonviewer.com/${address}`
    : `https://testnet.tonviewer.com/${address}`;
}

export function explorerNftUrl(address: string) {
  return IS_MAINNET
    ? `https://tonviewer.com/${address}`
    : `https://testnet.tonviewer.com/${address}`;
}

export function isTonTestnet(chain?: string | number | null) {
  return String(chain) === TON_TESTNET_CHAIN;
}

export function isTonMainnet(chain?: string | number | null) {
  return String(chain) === TON_MAINNET_CHAIN;
}

export function networkLabel() {
  return IS_MAINNET ? 'MAINNET' : 'TESTNET';
}
