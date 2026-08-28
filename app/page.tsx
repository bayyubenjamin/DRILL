'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Zap, Trophy, RefreshCw, Lock, ShieldCheck, Pickaxe } from 'lucide-react';
import { useTonAddress } from '@tonconnect/ui-react';
import WalletConnect from '@/components/Wallet/WalletConnect';
import { getLevelProgress } from '@/lib/level/calculator';

const GENESIS_END_TIMESTAMP = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).getTime();

const DrillCoreAnimation = ({ isClaiming }: { isClaiming: boolean }) => {
  return (
    <div className="relative flex items-center justify-center my-8 h-64 w-full">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: isClaiming ? [0.4, 0.8, 0.4] : [0.15, 0.35, 0.15] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} className="absolute w-60 h-60 border border-emerald-500/20 rounded-full border-dashed" />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="absolute w-44 h-44 border-2 border-zinc-800/80 rounded-full flex items-center justify-center">
        <div className="w-full h-full rounded-full border-t-2 border-b-2 border-emerald-400/40" />
      </motion.div>
      <motion.div
        animate={isClaiming ? { y: [-2, -18, -2], scale: [1, 1.08, 1] } : { y: [0, -6, 0] }}
        transition={isClaiming ? { duration: 0.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 w-28 h-36 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-between p-3 overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.12)]"
      >
        <div className="w-full flex justify-between items-center text-[9px] font-mono text-zinc-500 px-1 border-b border-zinc-800/80 pb-1">
          <span>SYS-DRILL</span>
          <span className="text-emerald-400 font-semibold animate-pulse">ACTIVE</span>
        </div>
        <div className="relative flex flex-col items-center justify-center my-auto w-full">
          <Zap className={`w-9 h-9 ${isClaiming ? 'text-emerald-300' : 'text-emerald-500'}`} />
        </div>
      </motion.div>
    </div>
  );
};

const GenesisCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const distance = GENESIS_END_TIMESTAMP - Date.now();
      if (distance <= 0) return setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      setTimeLeft({
        d: Math.floor(distance / 86400000),
        h: Math.floor((distance % 86400000) / 3600000),
        m: Math.floor((distance % 3600000) / 60000),
        s: Math.floor((distance % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2 mt-4">
      <div className="flex justify-between items-center text-[10px] tracking-widest text-zinc-400 font-mono">
        <span className="flex items-center gap-1 text-amber-400/90 font-semibold">
          <Lock className="w-3 h-3" /> WITHDRAWAL LOCKED
        </span>
        <span>DEX LAUNCH IN</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center font-mono">
        {[
          { label: 'DAYS', val: timeLeft.d },
          { label: 'HOURS', val: timeLeft.h },
          { label: 'MINS', val: timeLeft.m },
          { label: 'SECS', val: timeLeft.s },
        ].map((item) => (
          <div key={item.label} className="bg-zinc-900/60 border border-zinc-800 rounded-md py-1.5 flex flex-col">
            <span className="text-base font-bold text-white">{String(item.val).padStart(2, '0')}</span>
            <span className="text-[9px] text-zinc-500 mt-0.5">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DrillEngineDashboard() {
  const walletAddress = useTonAddress();
  const [hasNft, setHasNft] = useState(false);
  const [account, setAccount] = useState({
    balance: 0,
    miningSpeed: 0,
    level: 1,
    lastClaimAt: null as string | null,
    miningActive: false,
    progressPercent: 0,
  });
  const [unclaimed, setUnclaimed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const initData = () => window.Telegram?.WebApp?.initData || '';

  const loadState = async () => {
    const payload = initData();
    if (!payload) {
      setLoading(false);
      return;
    }
    const res = await fetch('/api/mining/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: payload }),
    });
    const data = await res.json();
    if (data.success) {
      setHasNft(Boolean(data.hasNft));
      setAccount(data.account);
      setUnclaimed(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadState();
  }, []);

  useEffect(() => {
    if (!account.miningActive || !account.lastClaimAt) {
      setUnclaimed(0);
      return;
    }
    const tick = () => {
      const elapsedMin = Math.max(0, (Date.now() - new Date(account.lastClaimAt as string).getTime()) / 60000);
      setUnclaimed(elapsedMin * account.miningSpeed);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [account.miningActive, account.lastClaimAt, account.miningSpeed]);

  const displayBalance = account.balance + unclaimed;
  const progress = useMemo(() => getLevelProgress(displayBalance), [displayBalance]);

  const runAction = async (path: string, extra: Record<string, string> = {}) => {
    setBusy(true);
    setStatusMessage(null);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initData(), ...extra }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage(data.error || 'ACTION FAILED');
        return;
      }
      await loadState();
      if (path.includes('/mint')) setStatusMessage('NFT MINTED');
      if (path.includes('/start')) setStatusMessage('MINING STARTED');
      if (path.includes('/claim')) setStatusMessage(`CLAIMED +${Number(data.reward || 0).toFixed(4)} $DRILL`);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
    } catch (err) {
      console.error(err);
      setStatusMessage('NETWORK ERROR');
    } finally {
      setBusy(false);
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const action = !hasNft
    ? {
        label: walletAddress ? 'MINT MINING NFT' : 'CONNECT WALLET TO MINT',
        disabled: !walletAddress || busy,
        onClick: () => runAction('/api/nft/mint', { walletAddress }),
      }
    : !account.miningActive
      ? {
          label: 'START MINING',
          disabled: busy,
          onClick: () => runAction('/api/mining/start'),
        }
      : {
          label: 'CLAIM',
          disabled: busy || unclaimed <= 0,
          onClick: () => runAction('/api/mining/claim'),
        };

  return (
    <main className="min-h-screen max-w-md mx-auto bg-black text-white px-4 py-5 flex flex-col justify-between font-sans pb-8">
      <header className="flex justify-between items-center w-full pb-3 border-b border-zinc-900">
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-widest text-zinc-100 font-mono">DRILL ENGINE</h1>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest mt-0.5">OFF-CHAIN ECONOMY</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-mono tracking-wider text-emerald-400 font-semibold">GENESIS</span>
        </div>
      </header>

      <div className="mt-4 mb-2">
        <WalletConnect />
      </div>

      <section className="flex flex-col items-center justify-center my-6 text-center">
        <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-1">
          {loading ? 'SYNCING SUPABASE' : 'WALLET BALANCE'}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-mono font-light tracking-tight text-white">
            {displayBalance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </span>
          <span className="text-lg font-bold text-emerald-400">$DRILL</span>
        </div>
      </section>

      <section className="bg-zinc-950/90 border border-zinc-800 p-3.5 rounded-xl flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-xs font-mono">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <Trophy className="w-4 h-4" />
            <span>LEVEL {progress.currentLevel.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <Zap className="w-4 h-4" />
            <span>+{account.miningSpeed.toFixed(2)} $DRILL / MIN</span>
          </div>
        </div>
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
          <motion.div className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300" animate={{ width: `${progress.progressPercent}%` }} />
        </div>
      </section>

      <DrillCoreAnimation isClaiming={busy && account.miningActive} />

      <section className="flex flex-col items-center w-full gap-2 mt-auto">
        {statusMessage && (
          <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-md">
            {statusMessage}
          </div>
        )}
        <div className="flex justify-between w-full text-xs font-mono px-1">
          <span className="text-zinc-500">UNCLAIMED:</span>
          <span className="text-emerald-400 font-semibold">+{unclaimed.toFixed(4)} $DRILL</span>
        </div>
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={`relative w-full py-3.5 rounded-xl font-mono text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 ${action.disabled ? 'bg-zinc-900 text-zinc-600 border border-zinc-800' : 'bg-emerald-500 text-black border border-emerald-400'}`}
        >
          {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : hasNft && account.miningActive ? <Battery className="w-4 h-4" /> : <Pickaxe className="w-4 h-4" />}
          <span>{busy ? 'PROCESSING...' : action.label}</span>
        </button>
        <p className="text-[10px] text-zinc-500 font-mono text-center">
          {!hasNft ? 'Mint Mining NFT dulu sebelum tombol mining aktif.' : !account.miningActive ? 'NFT terdeteksi. Mulai mining untuk mengakumulasi $DRILL.' : 'Klaim kapan saja. Saldo tercatat di Supabase.'}
        </p>
        <GenesisCountdown />
      </section>
    </main>
  );
}
