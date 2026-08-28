'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { ExternalLink, LogOut, ShieldAlert, ShieldCheck, Wallet, X } from 'lucide-react';
import { explorerAccountUrl, isTonTestnet } from '@/lib/ton/network';

const WALLETS = [
  { appName: 'telegram-wallet', label: 'Wallet', hint: 'Telegram' },
  { appName: 'tonkeeper', label: 'Tonkeeper', hint: 'App / Extension' },
  { appName: 'mytonwallet', label: 'MyTonWallet', hint: 'App / Web' },
] as const;

export default function WalletConnect() {
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!address) {
      setNftActive(false);
      return;
    }
    setOpen(false);
    void persistWallet(address);
    void verifyNFT(address);
  }, [address]);

  const persistWallet = async (walletAddress: string) => {
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      if (!initData) return;
      await fetch('/api/user/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, walletAddress }),
      });
    } catch (err) {
      console.error('Wallet persist failed:', err);
    }
  };

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

  if (!isClient) {
    return <div className="h-12 w-full bg-zinc-900 animate-pulse rounded-xl" />;
  }

  return (
    <div className="flex flex-col items-center w-full gap-2">
      {!address ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            haptic();
            window.Telegram?.WebApp?.expand?.();
            setOpen(true);
          }}
          className="w-full py-3 px-4 bg-zinc-900 border border-emerald-500/40 rounded-xl font-mono text-xs font-bold tracking-widest text-emerald-400 flex items-center justify-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          CONNECT TON TESTNET
        </button>
      ) : (
        <div className="w-full p-3 bg-zinc-950 border border-emerald-500/30 rounded-xl font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${testnet ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-zinc-200 truncate">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] tracking-widest px-2 py-0.5 rounded border ${
                testnet
                  ? 'text-emerald-400 border-emerald-500/40'
                  : 'text-amber-400 border-amber-500/40'
              }`}>
                {testnet ? 'LIVE TESTNET' : 'WRONG NETWORK'}
              </span>
              <button type="button" onClick={() => tonConnectUI.disconnect()} className="text-zinc-500 hover:text-red-400 p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <a
            href={explorerAccountUrl(address)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-emerald-400"
          >
            View on Tonscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {address && !testnet && (
        <p className="text-[10px] font-mono text-amber-400 text-center">
          Tonkeeper masih mainnet. Settings → enable Testnet, lalu connect ulang.
        </p>
      )}

      {error && <p className="w-full text-[10px] font-mono text-red-400 text-center">{error}</p>}

      {address && testnet && (
        <div className="flex items-center space-x-1.5 text-[10px] font-mono mt-1">
          {isVerifying ? (
            <span className="text-amber-400 animate-pulse">VERIFYING TESTNET PASS...</span>
          ) : nftActive ? (
            <>
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-emerald-400 tracking-wider">TESTNET ACCESS LIVE</span>
            </>
          ) : (
            <>
              <ShieldAlert size={14} className="text-amber-400" />
              <span className="text-amber-400 tracking-wider">WALLET LIVE · PASS NOT MINTED</span>
            </>
          )}
        </div>
      )}

      {open &&
        createPortal(
          <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4" style={{ zIndex: 2147483647, background: 'rgba(0,0,0,0.78)' }} onClick={() => setOpen(false)}>
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-4" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-mono text-xs tracking-widest text-emerald-400">TON TESTNET</h2>
                <button type="button" onClick={() => setOpen(false)} className="text-zinc-500 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono mb-3">Aktifkan Testnet di Tonkeeper sebelum connect.</p>
              <div className="flex flex-col gap-2">
                {WALLETS.map((item) => (
                  <button
                    key={item.appName}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={async () => {
                      setError(null);
                      setBusy(item.appName);
                      haptic();
                      try {
                        await tonConnectUI.openSingleWalletModal(item.appName);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Gagal membuka wallet');
                      } finally {
                        setBusy(null);
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-left disabled:opacity-60"
                  >
                    <span className="font-mono text-xs text-white">{item.label}</span>
                    <span className="font-mono text-[10px] text-zinc-500">{busy === item.appName ? 'OPENING...' : item.hint}</span>
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
