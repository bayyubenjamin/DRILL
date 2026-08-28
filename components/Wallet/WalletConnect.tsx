'use client';

import { useEffect, useState } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Wallet, ShieldAlert, ShieldCheck, LogOut } from 'lucide-react';

export default function WalletConnect() {
  const userFriendlyAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [isVerifying, setIsVerifying] = useState(false);
  const [nftActive, setNftActive] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (userFriendlyAddress && isClient) {
      verifyNFT(userFriendlyAddress);
    }
  }, [userFriendlyAddress, isClient]);

  const verifyNFT = async (walletAddress: string) => {
    setIsVerifying(true);
    try {
      const WebApp = (await import('@twa-dev/sdk')).default;
      const initData = WebApp.initData || '';

      const res = await fetch('/api/nft/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, walletAddress })
      });
      const data = await res.json();
      if (data.success) {
        setNftActive(true);
      }
    } catch (error) {
      console.error('NFT Verification Failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isClient) {
    return <div className="h-12 w-full bg-zinc-900 animate-pulse rounded-xl" />;
  }

  return (
    <div className="flex flex-col items-center w-full gap-2">
      {/* Tombol Kustom yang Diprogram Langsung Memanggil openModal() */}
      {!userFriendlyAddress ? (
        <button
          onClick={() => tonConnectUI.openModal()}
          className="w-full py-3 px-4 bg-zinc-900 border border-emerald-500/40 hover:border-emerald-400 rounded-xl font-mono text-xs font-bold tracking-widest text-emerald-400 flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-[0.98]"
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>CONNECT TON WALLET</span>
        </button>
      ) : (
        <div className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-zinc-300 truncate">
              {userFriendlyAddress.slice(0, 4)}...{userFriendlyAddress.slice(-4)}
            </span>
          </div>
          <button
            onClick={() => tonConnectUI.disconnect()}
            className="text-zinc-500 hover:text-red-400 p-1.5 transition-colors"
            title="Disconnect Wallet"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Verifikasi NFT */}
      {userFriendlyAddress && (
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
