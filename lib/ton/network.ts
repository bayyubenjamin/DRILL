export const TON_TESTNET_CHAIN = '-3';
export const TON_MAINNET_CHAIN = '-239';

export const TON_NETWORK = 'testnet';

export const DRILL_JETTON_MASTER =
  process.env.NEXT_PUBLIC_DRILL_JETTON_MASTER ||
  'EQAEzspFZ0CyG8ITTUAOrWLN9nbkmENgp0Dq6jaXxcee8Pyy';

export const DRILL_PASS_COLLECTION =
  process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS ||
  'EQChy5T8N_AOxvRFVNiyphzALhFDdx4BTHM2z6N3HdeNXrfP';

export function explorerAccountUrl(address: string) {
  return `https://testnet.tonscan.org/address/${address}`;
}

export function isTonTestnet(chain?: string | number | null) {
  return String(chain) === TON_TESTNET_CHAIN;
}
