'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { LogOut, ShieldAlert, ShieldCheck, Wallet, X } from 'lucide-react';
import { isTonTestnet } from '@/lib/ton/network';

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
  const [error, setError] = useState<string | null>(null);
  const testnet = isTonTestnet(wallet?.account?.chain);

  useEffect(() => setIsClient(true), []);

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

  const persistWallet = async (walletAddress: string) => {
    const initData = window.Telegram?.WebApp?.initData || '';
    if (!initData) return;
    const res = await fetch('/api/user/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, walletAddress }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      setError(data.error || 'Wallet already bound to another account');
      setNftActive(false);
      await tonConnectUI.disconnect();
      return;
    }
    setError(null);
    void verifyNFT(walletAddress);
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
        setError(data.error || 'Wallet rejected');
        setNftActive(false);
        sessionStorage.removeItem(`drill:pass:${walletAddress}`);
        return;
      }
      const ready = Boolean(data.hasNft);
      setNftActive(ready);
      sessionStorage.setItem(`drill:pass:${walletAddress}`, ready ? '1' : '0');
    } catch (err) {
      console.error(err);
      setNftActive(false);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isClient) return <div className="h-12 w-full emboss animate-pulse" />;

  const passLine = testnet && (
    isVerifying ? (
      <span className="text-amber-400">CHECKING PASS</span>
    ) : nftActive ? (
      <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={12} /> PASS</span>
    ) : (
      <span className="text-amber-400 flex items-center gap-1"><ShieldAlert size={12} /> NO PASS</span>
    )
  );

  return (
    <div className="flex flex-col w-full gap-2">
      {!address ? (
        <button type="button" onClick={() => { setError(null); window.Telegram?.WebApp?.expand?.(); setOpen(true); }} className="emboss emboss-accent emboss-btn w-full py-3 px-4 font-mono text-xs font-bold tracking-widest text-emerald-400 flex items-center justify-center gap-2">
          <Wallet className="w-4 h-4" />
          CONNECT TON TESTNET
        </button>
      ) : compact ? (
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-400">
          <span className="flex items-center gap-2 text-zinc-200">
            <span className={`w-1.5 h-1.5 rounded-full ${testnet ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <span className="flex items-center gap-2">
            {passLine}
            <button type="button" onClick={() => tonConnectUI.disconnect()} className="text-zinc-500"><LogOut className="w-3.5 h-3.5" /></button>
          </span>
        </div>
      ) : (
        <div className="emboss emboss-accent w-full px-3 py-2.5 font-mono">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg border border-emerald-500/35 flex items-center justify-center bg-black/40">
                <ShieldCheck className={`w-4 h-4 ${nftActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] tracking-[0.28em] text-zinc-500">JARINGAN</p>
                <p className="text-[11px] tracking-widest text-white truncate">TON TESTNET</p>
                <div className="mt-0.5 text-[10px] tracking-widest">{passLine}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`text-[8px] tracking-widest px-2 py-1 rounded-full border ${testnet ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/5' : 'text-amber-400 border-amber-500/40'}`}>
                {testnet ? 'LIVE TESTNET' : 'WRONG NETWORK'}
              </span>
              <button type="button" onClick={() => tonConnectUI.disconnect()} className="text-zinc-500 p-1">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="text-[10px] font-mono text-red-400 text-center">{error}</p>}
      {open && createPortal(
        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4" style={{ zIndex: 2147483647, background: 'rgba(0,0,0,0.78)' }} onClick={() => setOpen(false)}>
          <div className="emboss w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-mono text-xs tracking-widest text-emerald-400">TON TESTNET</h2>
              <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4 text-zinc-500" /></button>
            </div>
            {WALLETS.map((item) => (
              <button key={item.appName} type="button" disabled={Boolean(busy)} onClick={async () => {
                setBusy(item.appName);
                try { await tonConnectUI.openSingleWalletModal(item.appName); } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); } finally { setBusy(null); }
              }} className="emboss w-full mb-2 flex items-center justify-between px-3 py-3">
                <span className="font-mono text-xs text-white">{item.label}</span>
                <span className="font-mono text-[10px] text-zinc-500">{busy === item.appName ? 'OPENING...' : item.hint}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
