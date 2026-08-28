'use client';

import { useEffect, useState } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function WalletConnect() {
  const userFriendlyAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [isVerifying, setIsVerifying] = useState(false);
  const [nftActive, setNftActive] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Pastikan komponen hanya aktif setelah di-render di client (browser)
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
      // Lazy import @twa-dev/sdk hanya saat dijalankan di client browser
      const WebApp = (await import('@twa-dev/sdk')).default;
      const initData = WebApp.initData || '';

      const res = await fetch('/api/nft/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          initData, 
          walletAddress 
        })
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

  // Jangan render apa pun sebelum client siap untuk mencegah mismatch SSR
  if (!isClient) {
    return <div className="h-12 w-full bg-zinc-900 animate-pulse rounded-lg" />;
  }

  return (
    <div className="flex flex-col items-center p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
      <div className="mb-4">
        <TonConnectButton className="my-ton-button-class" />
      </div>
      
      {userFriendlyAddress && (
        <div className="flex items-center space-x-2 text-xs font-mono">
          {isVerifying ? (
            <span className="text-zinc-400 animate-pulse">VERIFYING NFT ACCESS...</span>
          ) : nftActive ? (
            <>
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="text-emerald-500 tracking-widest">MINING ACCESS GRANTED</span>
            </>
          ) : (
            <>
              <ShieldAlert size={16} className="text-red-500" />
              <span className="text-red-500 tracking-widest">NO MINING NFT FOUND</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
