'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, Zap, Trophy, RefreshCw, Lock, ShieldCheck, Pickaxe } from 'lucide-react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import WalletConnect from '@/components/Wallet/WalletConnect';
import MiningDrill from '@/components/UI/MiningDrill';
import LevelUpModal from '@/components/UI/LevelUpModal';
import EmbossCard from '@/components/UI/EmbossCard';
import { getLevelProgress } from '@/lib/level/calculator';
import { DRILL_PASS_COLLECTION } from '@/lib/ton/network';
import { buyPassPayloadBase64, MINT_SEND_NANOTON } from '@/lib/ton/pass';
import { useLevelUpPopup } from '@/hooks/useLevelUpPopup';

export default function DrillEngineDashboard() {
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [hasNft, setHasNft] = useState(false);
  const [checkingPass, setCheckingPass] = useState(false);
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
    setCheckingPass(false);
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
    if (!payload) {
      setCheckingPass(false);
      return;
    }
    setCheckingPass(true);
    try {
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
    } finally {
      setCheckingPass(false);
    }
  };

  useEffect(() => {
    if (walletAddress) setCheckingPass(true);
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

  const canMine = Boolean(walletAddress && hasNft && !checkingPass);
  const live = Boolean(canMine && account.miningActive);
  const engineBalance = walletAddress ? Number(account.balance || 0) : 0;
  const liveUnclaimed = live ? unclaimed : 0;
  const levelBalance = walletBalance + engineBalance;
  const progress = useMemo(() => getLevelProgress(levelBalance), [levelBalance]);
  const { popup, closePopup, armAfterClaim } = useLevelUpPopup(
    progress.currentLevel,
    Boolean(walletAddress && !checkingPass),
    walletAddress,
  );

  const mintOnchain = async () => {
    if (!walletAddress || checkingPass || busy) return;
    setBusy(true);
    setStatusMessage('CONFIRM IN TONKEEPER');
    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: DRILL_PASS_COLLECTION,
          amount: MINT_SEND_NANOTON.toString(),
          payload: buyPassPayloadBase64(),
        }],
      });
      setStatusMessage('TX SENT · CONFIRMING PASS');
      const payload = initData();
      for (let i = 0; i < 8; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const confirm = await fetch('/api/nft/mint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: payload, walletAddress }),
        });
        const confirmed = await confirm.json();
        if (confirm.ok && confirmed.hasNft) {
          setHasNft(true);
          setStatusMessage('PASS MINTED ON-CHAIN');
          await loadState();
          return;
        }
        setStatusMessage(`WAITING CHAIN · ${i + 1}/8`);
      }
      setStatusMessage('TX SENT · PASS NOT INDEXED YET · TAP REFRESH');
      await loadState();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'MINT REJECTED');
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (path: string) => {
    if (!canMine || busy) return;
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
      if (path.includes('/claim')) armAfterClaim();
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
    : checkingPass
      ? { label: 'CHECKING PASS...', disabled: true, onClick: () => undefined }
      : !hasNft
        ? { label: 'MINT PASS ON-CHAIN · 1 TON', disabled: busy, onClick: mintOnchain }
        : !account.miningActive
          ? { label: 'START MINING', disabled: busy, onClick: () => runAction('/api/mining/start') }
          : { label: 'CLAIM TO ENGINE', disabled: busy || liveUnclaimed <= 0, onClick: () => runAction('/api/mining/claim') };

  return (
    <main className="min-h-screen max-w-md mx-auto text-white px-4 py-5 flex flex-col justify-between font-sans pb-8">
      <LevelUpModal open={Boolean(popup)} level={popup?.to || 0} title={popup?.title || ''} onClose={closePopup} />
      <header className="flex justify-between items-center w-full pb-3 border-b border-white/10">
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-widest text-zinc-100 font-mono">DRILL ENGINE</h1>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest mt-0.5">TON TESTNET</span>
        </div>
        <div className="emboss emboss-accent px-2.5 py-1 rounded-md flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-mono tracking-wider text-emerald-400 font-semibold">TESTNET</span>
        </div>
      </header>
      <div className="mt-4 mb-2"><WalletConnect /></div>
      <EmbossCard className="my-5 px-4 py-5 text-center" accent>
        <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-1 block">ENGINE BALANCE</span>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-mono font-light tracking-tight text-white">
            {engineBalance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </span>
          <span className="text-lg font-bold text-emerald-400">$DRILL</span>
        </div>
      </EmbossCard>
      <EmbossCard className="p-3.5 flex flex-col gap-2.5" accent={live}>
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
        <div className="w-full h-2 rounded-full overflow-hidden emboss-inset">
          <motion.div className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300" animate={{ width: `${progress.progressPercent}%` }} />
        </div>
      </EmbossCard>
      <MiningDrill active={live} />
      <section className="flex flex-col items-center w-full gap-2 mt-auto">
        {statusMessage && <div className="emboss emboss-accent text-[10px] font-mono text-emerald-400 px-3 py-1">{statusMessage}</div>}
        <EmbossCard className="w-full px-3 py-2" inset>
          <div className="flex justify-between w-full text-xs font-mono">
            <span className="text-zinc-500">UNCLAIMED</span>
            <span className="text-emerald-400 font-semibold">+{liveUnclaimed.toFixed(4)} $DRILL</span>
          </div>
        </EmbossCard>
        <button onClick={action.onClick} disabled={action.disabled} className={`emboss-btn relative w-full py-3.5 font-mono text-xs font-bold flex items-center justify-center gap-2 ${action.disabled ? 'bg-zinc-900 text-zinc-600 border border-zinc-800' : 'bg-emerald-500 text-black'}`}>
          {busy || checkingPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : live ? <Battery className="w-4 h-4" /> : <Pickaxe className="w-4 h-4" />}
          <span>{busy ? 'PROCESSING...' : action.label}</span>
        </button>
        <EmbossCard className="w-full p-3 mt-3">
          <div className="flex justify-between items-center text-[10px] tracking-widest text-zinc-400 font-mono">
            <span className="flex items-center gap-1 text-amber-400/90 font-semibold"><Lock className="w-3 h-3" /> LEVEL = WALLET + CLAIMED</span>
            <span>UNCLAIMED EXCLUDED</span>
          </div>
        </EmbossCard>
      </section>
    </main>
  );
}
