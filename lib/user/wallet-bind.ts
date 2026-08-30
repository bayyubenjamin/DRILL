import { Address } from '@ton/core';
import { supabaseAdmin } from '@/lib/supabase/server';

export type WalletBindResult =
  | { ok: true; wallet: string }
  | { ok: false; code: 'WALLET_TAKEN' | 'WALLET_LOCKED' | 'INVALID_WALLET'; error: string; boundWallet?: string };

export function canonicalizeTonAddress(walletAddress: string) {
  const parsed = Address.parse(walletAddress);
  return parsed.toString({ urlSafe: true, bounceable: true, testOnly: true });
}

export function sameTonAddress(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  try {
    return Address.parse(a).equals(Address.parse(b));
  } catch {
    return a === b;
  }
}

function walletLookupForms(walletAddress: string) {
  try {
    const parsed = Address.parse(walletAddress);
    return Array.from(
      new Set([
        walletAddress,
        parsed.toString(),
        parsed.toString({ urlSafe: true, bounceable: true, testOnly: true }),
        parsed.toString({ urlSafe: true, bounceable: false, testOnly: true }),
        parsed.toRawString(),
      ]),
    );
  } catch {
    return [walletAddress];
  }
}

export async function bindWalletToUser(userId: string, walletAddress: string): Promise<WalletBindResult> {
  let canonical: string;
  try {
    canonical = canonicalizeTonAddress(walletAddress);
  } catch {
    return { ok: false, code: 'INVALID_WALLET', error: 'Invalid TON wallet' };
  }

  const { data: current, error: currentError } = await supabaseAdmin
    .from('users')
    .select('id, wallet_address')
    .eq('id', userId)
    .maybeSingle();
  if (currentError) throw currentError;

  if (current?.wallet_address && !sameTonAddress(current.wallet_address, walletAddress)) {
    return {
      ok: false,
      code: 'WALLET_LOCKED',
      error: 'This Telegram account is already bound to another wallet',
      boundWallet: current.wallet_address,
    };
  }

  const forms = walletLookupForms(walletAddress);
  const { data: takenRows, error: takenError } = await supabaseAdmin
    .from('users')
    .select('id, wallet_address')
    .in('wallet_address', forms);
  if (takenError) throw takenError;

  const owner = (takenRows || []).find((row) => sameTonAddress(row.wallet_address, walletAddress));
  if (owner && owner.id !== userId) {
    return {
      ok: false,
      code: 'WALLET_TAKEN',
      error: 'This wallet is already bound to another Telegram account',
      boundWallet: owner.wallet_address,
    };
  }

  if (current?.wallet_address && sameTonAddress(current.wallet_address, walletAddress)) {
    return { ok: true, wallet: current.wallet_address };
  }

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ wallet_address: canonical })
    .eq('id', userId);
  if (updateError) {
    if (updateError.code === '23505') {
      return {
        ok: false,
        code: 'WALLET_TAKEN',
        error: 'This wallet is already bound to another Telegram account',
      };
    }
    throw updateError;
  }

  return { ok: true, wallet: canonical };
}
