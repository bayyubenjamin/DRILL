'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, Zap, Trophy, RefreshCw, Lock, ShieldCheck, Pickaxe } from 'lucide-react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import WalletConnect from '@/components/Wallet/WalletConnect';
import { getLevelProgress } from '@/lib/level/calculator';
import { DRILL_PASS_COLLECTION } from '@/lib/ton/network';
import { BUY_PASS_OPCODE } from '@/lib/ton/pass';
import { beginCell, toNano } from '@ton/core';

export default function DrillEngineDashboard() {
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [hasNft, setHasNft] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const initData = () => window.Telegram?.WebApp?.initData || '';

  const resetIdle = () => {
    setHasNft(false);
    setUnclaimed(0);
    setWalletBalance(0);
    setAccount({ balance: 0, miningSpeed: 0, level: 1, lastClaimAt: null, miningActive: false, progressPercent: 0 });
  };

  const loadState = async () => {
    if (!walletAddress) {
      resetIdle();
      return;
    }
    const payload = initData();
    if (!payload) return;
    const [stateRes, assetsRes] = await Promise.all([
      fetch('/api/mining/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: payload, walletAddress }),
      }),
      fetch('/api/user/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: payload, walletAddress }),
      }),
    ]);
    const data = await stateRes.json();
    const assets = await assetsRes.json();
    if (data.success) {
      setHasNft(Boolean(data.hasNft));
      setAccount(data.account);
    }
    if (assets.success) setWalletBalance(Number(assets.walletBalance || 0));
  };

  useEffect(() => {
    void loadState();
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress || !hasNft || !account.miningActive || !account.lastClaimAt) {
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
  }, [walletAddress, hasNft, account.miningActive, account.lastClaimAt, account.miningSpeed]);

  const canMine = Boolean(walletAddress && hasNft);
  const live = Boolean(canMine && account.miningActive);
  const engineBalance = canMine ? account.balance : 0;
  const liveUnclaimed = live ? unclaimed : 0;
  const levelBalance = walletBalance + engineBalance;
  const progress = useMemo(() => getLevelProgress(levelBalance), [levelBalance]);

  const mintOnchain = async () => {
    if (!walletAddress) return;
    setBusy(true);
    setStatusMessage('CONFIRM IN TONKEEPER');
    try {
      const payload = beginCell().storeUint(BUY_PASS_OPCODE, 32).storeUint(0, 64).endCell().toBoc().toString('base64');
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: DRILL_PASS_COLLECTION, amount: toNano('1.05').toString(), payload }],
      });
      setStatusMessage('TX SENT · WAITING CHAIN');
      setTimeout(() => void loadState(), 10000);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'MINT REJECTED');
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (path: string) => {
    if (!canMine) return;
    setBusy(true);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initData(), walletAddress }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage(data.error || 'ACTION FAILED');
        return;
      }
      await loadState();
      if (path.includes('/start')) setStatusMessage('MINING STARTED');
      if (path.includes('/claim')) setStatusMessage(`CLAIMED +${Number(data.reward || 0).toFixed(4)} $DRILL`);
    } catch {
      setStatusMessage('NETWORK ERROR');
    } finally {
      setBusy(false);
    }
  };

  const action = !walletAddress
    ? { label: 'CONNECT TESTNET WALLET FIRST', disabled: true, onClick: () => undefined }
    : !hasNft
      ? { label: 'MINT PASS ON-CHAIN \u00b7 1 TON', disabled: busy, onClick: mintOnchain }
      : !account.miningActive
        ? { label: 'START MINING', disabled: busy, onClick: () => runAction('/api/mining/start') }
        : { label: 'CLAIM TO ENGINE', disabled: busy || liveUnclaimed <= 0, onClick: () => runAction('/api/mining/claim') };

  return (
    <main className="min-h-screen max-w-md mx-auto bg-black text-white px-4 py-5 flex flex-col justify-between font-sans pb-8">
      <header className="flex justify-between items-center w-full pb-3 border-b border-zinc-900">
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-widest text-zinc-100 font-mono">DRILL ENGINE</h1>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest mt-0.5">TON TESTNET</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-mono tracking-wider text-emerald-400 font-semibold">TESTNET</span>
        </div>
      </header>
      <div className="mt-4 mb-2"><WalletConnect /></div>
      <section className="flex flex-col items-center justify-center my-6 text-center">
        <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-1">ENGINE BALANCE</span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-mono font-light tracking-tight text-white">
            {engineBalance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </span>
          <span className="text-lg font-bold text-emerald-400">$DRILL</span>
        </div>
      </section>
      <section className="bg-zinc-950/90 border border-zinc-800 p-3.5 rounded-xl flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-xs font-mono">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <Trophy className="w-4 h-4" />
            <span>LEVEL {progress.currentLevel}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <Zap className="w-4 h-4" />
            <span>+{(live ? account.miningSpeed : 0).toFixed(2)} $DRILL / MIN</span>
          </div>
        </div>
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
          <motion.div className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300" animate={{ width: `${progress.progressPercent}%` }} />
        </div>
      </section>
      <div className="relative flex items-center justify-center my-8 h-64 w-full">
        <div className="w-28 h-36 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center">
          <Zap className={`w-9 h-9 ${live ? 'text-emerald-400' : 'text-zinc-600'}`} />
          <span className="text-[9px] font-mono mt-2 text-zinc-500">{live ? 'MINING' : 'LOCKED'}</span>
        </div>
      </div>
      <section className="flex flex-col items-center w-full gap-2 mt-auto">
        {statusMessage && <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-md">{statusMessage}</div>}
        <div className="flex justify-between w-full text-xs font-mono px-1">
          <span className="text-zinc-500">UNCLAIMED:</span>
          <span className="text-emerald-400 font-semibold">+{liveUnclaimed.toFixed(4)} $DRILL</span>
        </div>
        <button onClick={action.onClick} disabled={action.disabled} className={`relative w-full py-3.5 rounded-xl font-mono text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 ${action.disabled ? 'bg-zinc-900 text-zinc-600 border border-zinc-800' : 'bg-emerald-500 text-black'}`}>
          {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : live ? <Battery className="w-4 h-4" /> : <Pickaxe className="w-4 h-4" />}
          <span>{busy ? 'PROCESSING...' : action.label}</span>
        </button>
        <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 mt-4">
          <div className="flex justify-between items-center text-[10px] tracking-widest text-zinc-400 font-mono">
            <span className="flex items-center gap-1 text-amber-400/90 font-semibold"><Lock className="w-3 h-3" /> LEVEL = WALLET + CLAIMED</span>
            <span>UNCLAIMED EXCLUDED</span>
          </div>
        </div>
      </section>
    </main>
  );
}
