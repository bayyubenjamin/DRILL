'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  ShieldCheck,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import WalletConnect from '@/components/Wallet/WalletConnect';

export default function ProfilePage() {
  const address = useTonAddress();
  const wallet = useTonWallet();
  const [copied, setCopied] = useState(false);
  const [tgUser, setTgUser] = useState<{
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    is_premium?: boolean;
  } | null>(null);

  useEffect(() => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (user) setTgUser(user);
  }, []);

  const displayName = useMemo(() => {
    if (!tgUser) return 'OPERATOR';
    const full = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
    return full || tgUser.username || 'OPERATOR';
  }, [tgUser]);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error('Copy address failed:', err);
    }
  };

  return (
    <main className="min-h-screen max-w-md mx-auto bg-black text-white px-4 py-5 flex flex-col font-mono pb-24">
      <header className="flex items-center justify-between pb-4 border-b border-zinc-900">
        <Link href="/" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          <span>DASHBOARD</span>
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] tracking-widest text-emerald-400 font-semibold">PROFILE</span>
        </div>
      </header>

      <section className="mt-5 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-emerald-500/40 flex items-center justify-center">
          <User className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-wide truncate">{displayName}</p>
          <p className="text-[10px] text-zinc-500 tracking-widest">
            {tgUser?.username ? `@${tgUser.username}` : 'TELEGRAM IDENTITY NOT LINKED'}
          </p>
          {tgUser?.id && (
            <p className="text-[10px] text-zinc-600 mt-1">TG ID {tgUser.id}</p>
          )}
        </div>
        {tgUser?.is_premium && (
          <span className="ml-auto text-[9px] tracking-widest text-amber-400 border border-amber-500/30 px-2 py-1 rounded">
            PREMIUM
          </span>
        )}
      </section>

      <section className="mt-4">
        <p className="text-[10px] tracking-widest text-zinc-500 mb-2">WALLET</p>
        <WalletConnect />
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <p className="text-[9px] text-zinc-500 tracking-widest">NETWORK</p>
          <p className="text-xs text-emerald-400 mt-1">TON</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <p className="text-[9px] text-zinc-500 tracking-widest">STATUS</p>
          <p className={`text-xs mt-1 ${address ? 'text-emerald-400' : 'text-zinc-400'}`}>
            {address ? 'CONNECTED' : 'DISCONNECTED'}
          </p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <p className="text-[9px] text-zinc-500 tracking-widest">PROVIDER</p>
          <p className="text-xs text-zinc-200 mt-1 truncate">
            {wallet?.device.appName || 'NONE'}
          </p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <p className="text-[9px] text-zinc-500 tracking-widest">ACCESS</p>
          <p className="text-xs text-amber-400 mt-1">GENESIS</p>
        </div>
      </section>

      {address && (
        <section className="mt-4 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <p className="text-[9px] text-zinc-500 tracking-widest mb-2">FULL ADDRESS</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-[10px] text-zinc-300 break-all leading-relaxed">{address}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </section>
      )}

      <section className="mt-4 flex flex-col gap-2">
        <Link
          href="/referral"
          className="w-full py-3 px-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between"
        >
          <span className="text-[10px] tracking-widest text-zinc-300">REFERRAL SYSTEM</span>
          <Zap className="w-4 h-4 text-emerald-400" />
        </Link>
        <Link
          href="/tasks"
          className="w-full py-3 px-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between"
        >
          <span className="text-[10px] tracking-widest text-zinc-300">TASKS PROTOCOL</span>
          <Wallet className="w-4 h-4 text-emerald-400" />
        </Link>
      </section>
    </main>
  );
}
