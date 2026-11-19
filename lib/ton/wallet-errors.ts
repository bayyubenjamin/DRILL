// Why a wallet disconnected or failed to bind, in plain English for the
// user. One Telegram account = one wallet, and one wallet = one Telegram
// account; that rule is enforced server-side in /api/user/wallet.

export type WalletFailureKind = 'taken' | 'locked' | 'invalid' | 'session' | 'not-found' | 'server' | 'network';

export interface WalletFailure {
  kind: WalletFailureKind;
  /** Short title for the toast. */
  title: string;
  /** Explanation + what the user should do. */
  message: string;
  /** true = a binding rule was definitely broken; the wallet must disconnect. */
  mustDisconnect: boolean;
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Translate a failed /api/user/wallet response into a clear reason.
 * `code` is the server code (WALLET_TAKEN / WALLET_LOCKED /
 * INVALID_WALLET) or the HTTP status; `boundWallet` is the wallet address
 * already bound (when the server returns one).
 */
export function describeWalletFailure(
  opts: { code?: string | null; status?: number | null; boundWallet?: string | null },
): WalletFailure {
  const bound = opts.boundWallet ? shortAddress(opts.boundWallet) : null;
  switch (opts.code) {
    case 'WALLET_TAKEN':
      return {
        kind: 'taken',
        title: 'Wallet already used by another account',
        message:
          'This wallet is already bound to another Telegram account. One wallet is for one account only — connect a different wallet.',
        mustDisconnect: true,
      };
    case 'WALLET_LOCKED':
      return {
        kind: 'locked',
        title: 'This account is already bound to another wallet',
        message: bound
          ? `Your Telegram account is already bound to wallet ${bound}. One account, one wallet — connect that wallet ${bound}.`
          : 'Your Telegram account is already bound to another wallet. One account, one wallet — connect the wallet that is already bound.',
        mustDisconnect: true,
      };
    case 'INVALID_WALLET':
      return {
        kind: 'invalid',
        title: 'Invalid wallet address',
        message: 'The wallet address sent was not recognized. Try connecting again from your wallet app.',
        mustDisconnect: true,
      };
    default:
      break;
  }
  if (opts.status === 401) {
    return {
      kind: 'session',
      title: 'Telegram session expired',
      message:
        'Close the Mini App and reopen it from the @drillengine_bot bot, then connect your wallet. Your wallet stays connected for now.',
      mustDisconnect: false,
    };
  }
  if (opts.status === 404) {
    return {
      kind: 'not-found',
      title: 'Account not registered yet',
      message:
        'Your Telegram account is not registered in Drill yet. Close and reopen the Mini App from the bot, then connect your wallet.',
      mustDisconnect: false,
    };
  }
  if (opts.status === 500 || opts.status === 502 || opts.status === 503) {
    return {
      kind: 'server',
      title: 'Server is having issues',
      message:
        'Your wallet stays connected — only the server record failed. Try again in a moment.',
      mustDisconnect: false,
    };
  }
  return {
    kind: 'network',
    title: 'Cannot reach the server',
    message: 'Check your internet connection and try again. Your wallet stays connected for now.',
    mustDisconnect: false,
  };
}
