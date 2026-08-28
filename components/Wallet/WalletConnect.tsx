'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { LogOut, ShieldAlert, ShieldCheck, Wallet, X } from 'lucide-react';

const WALLETS = [
  {
    appName: 'telegram-wallet',
    label: 'Wallet',
    hint: 'Telegram',
  },
  {
    appName: 'tonkeeper',
    label: 'Tonkeeper',
    hint: 'App / Extension',
  },
  {
    appName: 'mytonwallet',
    label: 'MyTonWallet',
    hint: 'App / Web',
  },
] as const;

export default function WalletConnect() {
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [isClient, setIsClient] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [nftActive, setNftActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!address) {
      setNftActive(false);
      return;
    }
    setOpen(false);
    void verifyNFT(address);
  }, [address]);

  const verifyNFT = async (walletAddress: string) => {
    setIsVerifying(true);
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/nft/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, walletAddress }),
      });
      const data = await res.json();
      if (data.success) setNftActive(true);
    } catch (err) {
      console.error('NFT Verification Failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const haptic = () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
  };

  const handleOpenPicker = () => {
    setError(null);
    haptic();
    window.Telegram?.WebApp?.expand?.();
    setOpen(true);
  };

  const handlePickWallet = async (appName: string) => {
    setError(null);
    setBusy(appName);
    haptic();
    try {
      await tonConnectUI.openSingleWalletModal(appName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal membuka wallet';
      console.error('TonConnect openSingleWalletModal failed:', err);
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (err) {
      console.error('TonConnect disconnect failed:', err);
    }
  };

  if (!isClient) {
    return <div className="h-12 w-full bg-zinc-900 animate-pulse rounded-xl" />;
  }

  return (
    <div className="flex flex-col items-center w-full gap-2">
      {!address ? (
        <button
          type="button"
          onClick={handleOpenPicker}
          className="w-full py-3 px-4 bg-zinc-900 border border-emerald-500/40 hover:border-emerald-400 rounded-xl font-mono text-xs font-bold tracking-widest text-emerald-400 flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-[0.98] cursor-pointer"
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>CONNECT TON WALLET</span>
        </button>
      ) : (
        <div className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-zinc-300 truncate">
              {address.slice(0, 4)}...{address.slice(-4)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDisconnect}
            className="text-zinc-500 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
            title="Disconnect Wallet"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="w-full text-[10px] font-mono text-red-400 text-center break-words">
          {error}
        </p>
      )}

      {address && (
        <div className="flex items-center space-x-1.5 text-[10px] font-mono mt-1">
          {isVerifying ? (
            <span className="text-amber-400 animate-pulse">VERIFYING NFT ACCESS...</span>
          ) : nftActive ? (
            <>
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-emerald-400 tracking-wider">MINING ACCESS GRANTED</span>
            </>
          ) : (
            <>
              <ShieldAlert size={14} className="text-amber-400" />
              <span className="text-amber-400 tracking-wider">NO MINING NFT FOUND (SYNC OK)</span>
            </>
          )}
        </div>
      )}

      {open &&
        createPortal(
          <div
            className="fixed inset-0 flex items-end sm:items-center justify-center p-4"
            style={{ zIndex: 2147483647, background: 'rgba(0,0,0,0.78)' }}
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-xs tracking-widest text-emerald-400">SELECT WALLET</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.appName}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => handlePickWallet(wallet.appName)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-left disabled:opacity-60"
                  >
                    <span className="font-mono text-xs text-white tracking-wider">{wallet.label}</span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {busy === wallet.appName ? 'OPENING...' : wallet.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
