'use client';

import { useEffect, useState } from 'react';
import {
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
} from '@tonconnect/ui-react';
import { ShieldAlert, ShieldCheck, Wallet } from 'lucide-react';

const QUICK_WALLETS = [
  { appName: 'telegram-wallet', label: 'TELEGRAM WALLET' },
  { appName: 'tonkeeper', label: 'TONKEEPER' },
] as const;

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        disableVerticalSwipes?: () => void;
        openTelegramLink?: (url: string) => void;
        HapticFeedback?: {
          impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
        };
      };
    };
  }
}

export default function WalletConnect() {
  const address = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [isClient, setIsClient] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [nftActive, setNftActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!address) return;
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

  const openModal = async () => {
    setError(null);
    setBusy(true);
    haptic();
    try {
      if (!tonConnectUI) {
        throw new Error('TonConnect belum siap');
      }
      await tonConnectUI.openModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal membuka modal wallet';
      console.error('TonConnect openModal failed:', err);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const openWallet = async (appName: string) => {
    setError(null);
    setBusy(true);
    haptic();
    try {
      if (!tonConnectUI) {
        throw new Error('TonConnect belum siap');
      }
      await tonConnectUI.openSingleWalletModal(appName);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Gagal membuka ${appName}`;
      console.error('TonConnect openSingleWalletModal failed:', err);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  if (!isClient) {
    return <div className="h-12 w-full bg-zinc-900 animate-pulse rounded-xl" />;
  }

  return (
    <div className="flex flex-col items-center w-full gap-2">
      <div className="w-full flex justify-center tonconnect-button-wrap">
        <TonConnectButton style={{ width: '100%' }} />
      </div>

      {!wallet && (
        <>
          <button
            type="button"
            onClick={openModal}
            disabled={busy}
            className="w-full py-3 px-4 bg-zinc-900 border border-emerald-500/40 hover:border-emerald-400 rounded-xl font-mono text-xs font-bold tracking-widest text-emerald-400 flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>{busy ? 'OPENING WALLET...' : 'CONNECT TON WALLET'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            {QUICK_WALLETS.map((item) => (
              <button
                key={item.appName}
                type="button"
                onClick={() => openWallet(item.appName)}
                disabled={busy}
                className="py-2 px-3 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-lg font-mono text-[10px] tracking-widest text-zinc-300 disabled:opacity-60"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
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
    </div>
  );
}
