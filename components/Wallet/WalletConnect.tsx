'use client';

import { useEffect, useRef, useState } from 'react';
import { useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Check, Copy, LogOut, ShieldAlert, ShieldCheck, User, Wallet, X } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { IS_MAINNET, isTonMainnet, isTonTestnet, networkLabel } from '@/lib/ton/network';
import { describeWalletFailure, shortAddress } from '@/lib/ton/wallet-errors';
import { showToast } from '@/components/UI/Toast';
import SheetModal from '@/components/UI/SheetModal';

const WALLETS = [
  { appName: 'telegram-wallet', label: 'Wallet', hint: 'Telegram' },
  { appName: 'tonkeeper', label: 'Tonkeeper', hint: 'App / Extension' },
  { appName: 'mytonwallet', label: 'MyTonWallet', hint: 'App / Web' },
] as const;

export default function WalletConnect({ compact = false }: { compact?: boolean }) {
  const address = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [isClient, setIsClient] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [nftActive, setNftActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [tgName, setTgName] = useState('OPERATOR');
  // The wallet bound to this Telegram account according to the database —
  // the source of truth when the TonConnect session on this device is gone.
  const storeWallet = useUserStore((s) => s.user?.wallet_address ?? null);
  const [boundWallet, setBoundWallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const boundFetchedRef = useRef(false);
  const chainOk = IS_MAINNET ? isTonMainnet(wallet?.account?.chain) : isTonTestnet(wallet?.account?.chain);
  // true when the disconnect is intentional (disconnect button / binding
  // rule) — don't show the "disconnected" toast for those.
  const disconnectExpectedRef = useRef(false);
  const wasConnectedRef = useRef(false);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!user) return;
    const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
    setTgName(full || (user.username ? `@${user.username}` : 'OPERATOR'));
  }, []);

  // The bound wallet already comes home with /api/user/auth when the app
  // opens (stored in useUserStore) — so the card can show right away
  // without waiting for one extra request. The sessionStorage cache is
  // used so the card shows instantly even before auth finishes; the GET to
  // /api/user/wallet only runs in the background when both are empty,
  // and NEVER blocks the CONNECT button (fail-open, 4s timeout).
  useEffect(() => {
    if (storeWallet) {
      setBoundWallet(storeWallet);
      try {
        sessionStorage.setItem('drill:bound-wallet', storeWallet);
      } catch {
        // ignore — the cache is only a speedup, not a requirement
      }
      return;
    }
    try {
      const cached = sessionStorage.getItem('drill:bound-wallet');
      if (cached) setBoundWallet(cached);
    } catch {
      // ignore
    }
  }, [storeWallet]);

  useEffect(() => {
    if (boundFetchedRef.current || boundWallet) return;
    const initData = window.Telegram?.WebApp?.initData || '';
    if (!initData) return;
    boundFetchedRef.current = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    void fetch(`/api/user/wallet?initData=${encodeURIComponent(initData)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (typeof data.walletAddress === 'string' && data.walletAddress) {
          setBoundWallet(data.walletAddress);
          try {
            sessionStorage.setItem('drill:bound-wallet', data.walletAddress);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => undefined)
      .finally(() => clearTimeout(timer));
  }, [boundWallet]);

  // Tell the user when the wallet disconnects on its own from outside
  // (e.g. disconnected from the wallet app, or the TonConnect session
  // ended) — this used to happen silently with no notice at all.
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((next) => {
      const connected = Boolean(next);
      if (wasConnectedRef.current && !connected && !disconnectExpectedRef.current) {
        showToast({
          kind: 'info',
          title: 'Wallet disconnected',
          message:
            'The wallet connection was closed from outside — for example disconnected from the wallet app or the session ended. Connect again if needed.',
        });
      }
      if (connected) disconnectExpectedRef.current = false;
      wasConnectedRef.current = connected;
    });
    return () => unsubscribe();
  }, [tonConnectUI]);

  useEffect(() => {
    if (!address) {
      setNftActive(false);
      return;
    }
    const cached = sessionStorage.getItem(`drill:pass:${address}`);
    if (cached === '1') setNftActive(true);
    setOpen(false);
    void persistWallet(address);
  }, [address]);

  const disconnectSilently = async () => {
    disconnectExpectedRef.current = true;
    await tonConnectUI.disconnect();
  };

  const persistWallet = async (walletAddress: string) => {
    const initData = window.Telegram?.WebApp?.initData || '';
    if (!initData) return;
    let res: Response;
    try {
      res = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, walletAddress }),
      });
    } catch {
      // Network failed: not the wallet's fault — don't disconnect, explain
      // why and offer to try again.
      const failure = describeWalletFailure({});
      showToast({
        kind: 'error',
        title: failure.title,
        message: failure.message,
        actionLabel: 'TRY AGAIN',
        onAction: () => void persistWallet(walletAddress),
      });
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      const failure = describeWalletFailure({
        code: data.code ?? null,
        status: res.status,
        boundWallet: data.boundWallet ?? null,
      });
      showToast({
        kind: 'error',
        title: failure.title,
        message: failure.message,
        ...(failure.mustDisconnect
          ? {}
          : { actionLabel: 'TRY AGAIN', onAction: () => void persistWallet(walletAddress) }),
      });
      setNftActive(false);
      // Only disconnect when a rule is broken (wallet already bound to
      // another account / account already bound to another wallet / invalid
      // address). Server trouble, an expired session, or network issues:
      // the wallet stays connected so the user can retry without
      // reconnecting.
      if (failure.mustDisconnect) await disconnectSilently();
      return;
    }
    void verifyNFT(walletAddress);
    setBoundWallet(data.walletAddress ?? walletAddress);
    try {
      sessionStorage.setItem('drill:bound-wallet', data.walletAddress ?? walletAddress);
    } catch {
      // ignore
    }
    showToast({
      kind: 'success',
      title: 'Wallet connected',
      message: `${shortAddress(walletAddress)} is now bound to your Telegram account. One account, one wallet.`,
    });
  };

  const verifyNFT = async (walletAddress: string) => {
    const cached = sessionStorage.getItem(`drill:pass:${walletAddress}`);
    if (cached !== '1') setIsVerifying(true);
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/nft/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, walletAddress }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNftActive(false);
        sessionStorage.removeItem(`drill:pass:${walletAddress}`);
        showToast({
          kind: 'error',
          title: 'Could not check Drill Pass',
          message:
            'The pass status cannot be checked right now, but your wallet stays connected. Close and reopen the Mini App if needed.',
        });
        return;
      }
      const ready = Boolean(data.hasNft);
      setNftActive(ready);
      sessionStorage.setItem(`drill:pass:${walletAddress}`, ready ? '1' : '0');
    } catch (err) {
      console.error(err);
      setNftActive(false);
      showToast({
        kind: 'error',
        title: 'Could not check Drill Pass',
        message: 'Could not reach the server to check the pass. Your wallet stays connected.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isClient) return <div className="h-12 w-full emboss animate-pulse" />;

  const passLine = isVerifying ? (
    <span className="text-amber-400">CHECKING PASS</span>
  ) : nftActive ? (
    <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={12} /> PASS</span>
  ) : (
    <span className="text-amber-400 flex items-center gap-1"><ShieldAlert size={12} /> NO PASS</span>
  );

  const shortWallet = address ? shortAddress(address) : 'NO WALLET';

  return (
    <div className="flex flex-col w-full gap-2">
      {!address ? (
        boundWallet ? (
          <div className="emboss emboss-accent w-full px-3 py-2.5 font-mono">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg border border-emerald-500/35 flex items-center justify-center bg-black/40">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] tracking-[0.28em] text-emerald-400">BOUND WALLET · {networkLabel()}</p>
                  <p className="text-[11px] tracking-widest text-white truncate">{shortAddress(boundWallet)}</p>
                  <p className="mt-0.5 text-[9px] tracking-wider text-zinc-500">This account was previously connected to this wallet</p>
                </div>
              </div>
              <button type="button" aria-label="Copy bound wallet address" onClick={async () => { try { await navigator.clipboard.writeText(boundWallet); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } }} className="text-zinc-400 p-1 shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button type="button" onClick={() => { window.Telegram?.WebApp?.expand?.(); setOpen(true); }} className="emboss emboss-btn w-full mt-2.5 py-2.5 px-4 font-mono text-[11px] font-bold tracking-widest text-emerald-400 flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" />
              CONNECT AGAIN
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => { window.Telegram?.WebApp?.expand?.(); setOpen(true); }} className="emboss emboss-accent emboss-btn w-full py-3 px-4 font-mono text-xs font-bold tracking-widest text-emerald-400 flex items-center justify-center gap-2">
            <Wallet className="w-4 h-4" />
            CONNECT TON {networkLabel()}
          </button>
        )
      ) : compact ? (
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-400">
          <span className="flex items-center gap-2 text-zinc-200">
            <span className={`w-1.5 h-1.5 rounded-full ${chainOk ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {shortWallet}
          </span>
          <span className="flex items-center gap-2">
            {passLine}
            <button type="button" aria-label="Disconnect wallet" onClick={() => void disconnectSilently()} className="text-zinc-500"><LogOut className="w-3.5 h-3.5" /></button>
          </span>
        </div>
      ) : (
        <div className="emboss emboss-accent w-full px-3 py-2.5 font-mono">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg border border-emerald-500/35 flex items-center justify-center bg-black/40">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] tracking-[0.28em] text-zinc-500">TELEGRAM · {networkLabel()}</p>
                <p className="text-[11px] tracking-widest text-white truncate uppercase">{tgName}</p>
                <p className="mt-0.5 text-[10px] tracking-widest text-zinc-400 truncate">{shortWallet}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="text-[10px] tracking-widest">{passLine}</div>
              <button type="button" aria-label="Disconnect wallet" onClick={() => void disconnectSilently()} className="text-zinc-500 p-1">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      <SheetModal open={open} onClose={() => setOpen(false)} zIndex={2147483647} label="Connect TON wallet">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-xs tracking-widest text-emerald-400">TON {networkLabel()}</h2>
          <button type="button" aria-label="Close wallet picker" onClick={() => setOpen(false)}><X className="w-4 h-4 text-zinc-500" /></button>
        </div>
        {boundWallet && !address && (
          <p className="mb-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 font-mono text-[10px] leading-relaxed tracking-wider text-zinc-300">
            This account is bound to wallet <span className="text-emerald-400">{shortAddress(boundWallet)}</span> — pick the same wallet so it is not rejected.
          </p>
        )}
        {WALLETS.map((item) => (
          <button key={item.appName} type="button" disabled={Boolean(busy)} onClick={async () => {
            setBusy(item.appName);
            try { await tonConnectUI.openSingleWalletModal(item.appName); } catch (err) {
              showToast({
                kind: 'error',
                title: 'Could not open wallet',
                message: err instanceof Error ? err.message : 'Try again in a moment.',
              });
            } finally { setBusy(null); }
          }} className="emboss w-full mb-2 flex items-center justify-between px-3 py-3 active:scale-[0.98] transition-transform">
            <span className="font-mono text-xs text-white">{item.label}</span>
            <span className="font-mono text-[10px] text-zinc-500">{busy === item.appName ? 'OPENING...' : item.hint}</span>
          </button>
        ))}
      </SheetModal>
    </div>
  );
}
