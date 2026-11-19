'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Zap, Trophy, RefreshCw } from 'lucide-react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import WalletConnect from '@/components/Wallet/WalletConnect';
import MiningDrill from '@/components/UI/MiningDrill';
import AnimatedNumber from '@/components/UI/AnimatedNumber';
import Skeleton from '@/components/UI/Skeleton';
import EmbossCard from '@/components/UI/EmbossCard';
import { getLevelProgress } from '@/lib/level/calculator';
import { DRILL_PASS_COLLECTION } from '@/lib/ton/network';
import { buyPassPayloadBase64, MINT_SEND_NANOTON } from '@/lib/ton/pass';
import { useLevelUpPopup } from '@/hooks/useLevelUpPopup';
import { impact, notify, startClaimPulse } from '@/lib/telegram/haptic';

// Level-up popup is not needed at first paint — load it on demand.
const LevelUpModal = dynamic(() => import('@/components/UI/LevelUpModal'), { ssr: false });

function formatHms(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Last-known home state, so the numbers show instantly on reopen while
// fresh data loads (stale-while-revalidate). Always overwritten by the
// server response; never trusted for longer than 7 days.
const HOME_CACHE_PREFIX = 'drill:home-state:';

type HomeAccount = {
  balance: number;
  miningSpeed: number;
  level: number;
  lastClaimAt: string | null;
  miningActive: boolean;
  progressPercent: number;
};

function readHomeCache(walletAddress: string) {
  try {
    const raw = localStorage.getItem(`${HOME_CACHE_PREFIX}${walletAddress}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - Number(parsed.cachedAt || 0) > 7 * 24 * 60 * 60 * 1000) return null;
    if (!parsed.account || typeof parsed.account.balance !== 'number') return null;
    return parsed as { account: HomeAccount; walletBalance: number; hasNft: boolean };
  } catch {
    return null;
  }
}

function writeHomeCache(
  walletAddress: string,
  data: { account: HomeAccount; walletBalance: number; hasNft: boolean },
) {
  try {
    localStorage.setItem(
      `${HOME_CACHE_PREFIX}${walletAddress}`,
      JSON.stringify({ ...data, cachedAt: Date.now() }),
    );
  } catch {
    // ignore — cache is only a speedup
  }
}

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
  const [processLog, setProcessLog] = useState<string[]>(['ENGINE IDLE']);
  const [now, setNow] = useState(Date.now());

  const initData = () => window.Telegram?.WebApp?.initData || '';
  const pushLog = (line: string) => {
    setProcessLog((prev) => [line, ...prev].slice(0, 4));
  };

  const resetIdle = () => {
    setHasNft(false);
    setCheckingPass(false);
    setUnclaimed(0);
    setWalletBalance(0);
    setAccount({ balance: 0, miningSpeed: 0, level: 1, lastClaimAt: null, miningActive: false, progressPercent: 0 });
  };

  const loadState = async (opts?: { silent?: boolean }) => {
    if (!walletAddress) {
      resetIdle();
      return;
    }
    const payload = initData();
    if (!payload) {
      setCheckingPass(false);
      return;
    }
    if (!opts?.silent) setCheckingPass(true);
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
      if (data.success && assets.success) {
        writeHomeCache(walletAddress, {
          account: data.account,
          walletBalance: Number(assets.walletBalance || 0),
          hasNft: Boolean(data.hasNft),
        });
      }
    } finally {
      setCheckingPass(false);
    }
  };

  useEffect(() => {
    if (!walletAddress) {
      resetIdle();
      return;
    }
    // Show the last known numbers instantly while fresh data loads.
    const cached = readHomeCache(walletAddress);
    if (cached) {
      setAccount(cached.account);
      setWalletBalance(cached.walletBalance);
      setHasNft(cached.hasNft);
      setCheckingPass(false);
      void loadState({ silent: true });
      return;
    }
    setCheckingPass(true);
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
      setNow(Date.now());
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

  const sessionClock = live && account.lastClaimAt
    ? formatHms(now - new Date(account.lastClaimAt).getTime())
    : '00:00:00';

  const mintOnchain = async () => {
    if (!walletAddress || checkingPass || busy) return;
    impact('medium');
    setBusy(true);
    pushLog('CONFIRM IN TONKEEPER');
    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: DRILL_PASS_COLLECTION,
          amount: MINT_SEND_NANOTON.toString(),
          payload: buyPassPayloadBase64(),
        }],
      });
      notify('success');
      pushLog('TX SENT · CONFIRMING PASS');
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
          notify('success');
          pushLog('PASS MINTED ON-CHAIN');
          await loadState();
          return;
        }
        impact('light');
        pushLog(`WAITING CHAIN · ${i + 1}/8`);
      }
      notify('warning');
      pushLog('TX SENT · PASS NOT INDEXED YET');
      await loadState();
    } catch (err) {
      notify('error');
      pushLog(err instanceof Error ? err.message : 'MINT REJECTED');
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (path: string) => {
    if (!canMine || busy) return;
    const claiming = path.includes('/claim');
    const stopPulse = claiming ? startClaimPulse() : (impact('medium'), () => undefined);
    setBusy(true);
    pushLog(claiming ? 'CLAIMING $DRILL...' : 'STARTING ENGINE...');
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initData(), walletAddress }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify('error');
        pushLog(data.error || 'ACTION FAILED');
        return;
      }
      if (claiming) armAfterClaim();
      await loadState();
      if (path.includes('/start')) {
        impact('rigid');
        pushLog('MINING STARTED');
      }
      if (claiming) {
        notify('success');
        impact('heavy');
        pushLog(`CLAIMED +${Number(data.reward || 0).toFixed(4)} $DRILL`);
      }
    } catch {
      notify('error');
      pushLog('NETWORK ERROR');
    } finally {
      stopPulse();
      setBusy(false);
    }
  };

  const action = !walletAddress
    ? { label: 'Claim $Drill', disabled: true, onClick: () => undefined }
    : checkingPass
      ? { label: 'Checking Pass...', disabled: true, onClick: () => undefined }
      : !hasNft
        ? { label: 'Mint Pass', disabled: busy, onClick: mintOnchain }
        : !account.miningActive
          ? { label: 'Start Engine', disabled: busy, onClick: () => runAction('/api/mining/start') }
          : { label: 'Claim $Drill', disabled: busy || liveUnclaimed <= 0, onClick: () => runAction('/api/mining/claim') };

  return (
    <main className="min-h-screen max-w-md mx-auto text-white px-4 pt-3 pb-6 flex flex-col gap-2.5 font-sans">
      <LevelUpModal open={Boolean(popup)} level={popup?.to || 0} title={popup?.title || ''} onClose={closePopup} />

      <WalletConnect />

      <div className="text-center pt-1">
        <span className="text-[9px] font-mono tracking-[0.32em] text-zinc-500 uppercase block">ENGINE BALANCE</span>
        <div className="mt-1 flex items-baseline justify-center gap-1.5">
          {walletAddress && checkingPass ? (
            <Skeleton className="h-9 w-48" label="Loading engine balance" />
          ) : (
            <AnimatedNumber
              value={engineBalance}
              digits={4}
              className="text-[34px] leading-none font-mono font-light tracking-tight text-white tabular-nums"
            />
          )}
        </div>
        <span className="text-sm font-bold text-emerald-400 tracking-widest">$DRILL</span>
      </div>

      <div className="drill-stage relative min-h-[248px] flex items-end justify-center">
        <span className="drill-stage-glow" aria-hidden />
        <span className="drill-stage-ring" aria-hidden />
        <div className="drill-stage-float relative w-full">
          <MiningDrill active={live} />
        </div>
        <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-mono tracking-[0.3em] text-zinc-600 whitespace-nowrap">
          3D · DRAG TO ROTATE
        </p>
      </div>

      <EmbossCard className="px-3.5 py-2.5 flex flex-col gap-2" accent={live}>
        <div className="flex justify-between items-center text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-white font-medium">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <div className="leading-tight">
              <p className="text-[10px] tracking-widest">LEVEL {progress.currentLevel}</p>
              <p className="text-[9px] text-zinc-500 tracking-widest">NEXT LEVEL: {Math.round(progress.progressPercent)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-medium text-right">
            <Zap className="w-3.5 h-3.5" />
            <div className="leading-tight">
              <p className="text-[11px]">+{(live ? account.miningSpeed : 0).toFixed(2)} $DRILL / MIN</p>
              <p className="text-[8px] text-zinc-500 tracking-widest">MINING SPEED</p>
            </div>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden emboss-inset">
          <motion.div className="lime-bar" animate={{ width: `${progress.progressPercent}%` }} />
        </div>
      </EmbossCard>

      <section className="grid grid-cols-2 gap-2">
        <EmbossCard className="px-3 py-3 flex flex-col items-center text-center min-h-[188px]" accent={live}>
          <p className="text-[9px] tracking-[0.22em] text-zinc-500">DRILL STATUS</p>
          <p className={`mt-1 text-[11px] tracking-widest font-bold flex items-center gap-1.5 ${live ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {live ? 'EXTRACTING' : 'STANDBY'}
            {live && <span className="status-dot" />}
          </p>
          <div className={`extract-art mt-2 ${live ? 'is-live' : ''}`}>
            <img src="/drill-extract.svg" alt="" />
          </div>
          <p className="mt-1 text-[18px] font-mono tabular-nums leading-none">{sessionClock}</p>
          <p className="text-[8px] tracking-[0.22em] text-zinc-500 mt-1">TIME LIVE</p>
          <div className="w-full h-1 rounded-full overflow-hidden emboss-inset mt-2">
            <div className="lime-bar" style={{ width: live ? '72%' : '8%' }} />
          </div>
        </EmbossCard>

        <EmbossCard className="px-3 py-3 flex flex-col items-center text-center min-h-[188px]" accent={liveUnclaimed > 0}>
          <p className="text-[9px] tracking-[0.22em] text-zinc-500">REWARD</p>
          <p className="mt-1 text-[11px] tracking-widest font-bold text-zinc-300">UNCLAIMED</p>
          <AnimatedNumber
            value={liveUnclaimed}
            digits={4}
            prefix="+"
            className="mt-2 text-[20px] font-mono font-light text-emerald-400 leading-none tabular-nums"
          />
          <p className="text-[10px] text-emerald-400/80 tracking-widest mt-0.5">$DRILL</p>
          <div className="ore-art mt-1">
            <img src="/drill-ore.svg" alt="" />
          </div>
          <button
            type="button"
            disabled={action.disabled}
            onPointerDown={() => { if (!action.disabled) impact('medium'); }}
            onClick={action.onClick}
            className={`emboss-btn mt-auto w-full py-2 text-[9px] font-bold ${
              !action.disabled ? 'claim-cta' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
            }`}
          >
            {busy ? 'PROCESSING...' : action.label}
          </button>
        </EmbossCard>
      </section>

      <div className="emboss emboss-inset w-full px-3 py-2.5 font-mono">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[8px] tracking-[0.28em] text-zinc-500">PROCESS LOG</p>
          {busy || checkingPass ? <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" /> : <span className="status-dot" />}
        </div>
        <div className="flex flex-col gap-0.5 min-h-[52px]" aria-live="polite">
          {processLog.map((line, i) => (
            <p key={`${line}-${i}`} className={`text-[10px] tracking-wide ${i === 0 ? 'text-emerald-400 log-line-new' : 'text-zinc-500'}`}>
              {i === 0 ? '› ' : '  '}{line}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
