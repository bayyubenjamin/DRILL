'use client';

import { useEffect, useState } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { LogOut, ShieldAlert, ShieldCheck, Wallet } from 'lucide-react';

export default function WalletConnect() {
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [isClient, setIsClient] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [nftActive, setNftActive] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!address) {
      setNftActive(false);
      return;
    }
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
        <div className="relative w-full h-12">
          <div className="absolute inset-0 py-3 px-4 bg-zinc-900 border border-emerald-500/40 rounded-xl font-mono text-xs font-bold tracking-widest text-emerald-400 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)] pointer-events-none">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>CONNECT TON WALLET</span>
          </div>
          {/* Official TonConnect control must receive the tap inside Telegram WebView */}
          <div className="absolute inset-0 z-10 opacity-0 [&_*]:!w-full [&_*]:!h-full [&_*]:!min-w-full">
            <TonConnectButton style={{ width: '100%', height: '48px' }} />
          </div>
        </div>
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
