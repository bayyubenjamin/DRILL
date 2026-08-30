'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Trophy, Wallet } from 'lucide-react';
import { useTonAddress } from '@tonconnect/ui-react';
import { calculateLevel, getLevelProgress, MAX_LEVEL } from '@/lib/level/calculator';
import { getLevelTitle, getVisibleLevelCards } from '@/lib/level/ranks';
import DrillPassCard from '@/components/UI/DrillPassCard';
import LevelUpModal from '@/components/UI/LevelUpModal';

export default function DrillPage() {
  const walletAddress = useTonAddress();
  const [hasNft, setHasNft] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [engineBalance, setEngineBalance] = useState(0);
  const [unclaimed, setUnclaimed] = useState(0);
  const [miningActive, setMiningActive] = useState(false);
  const [miningSpeed, setMiningSpeed] = useState(0);
  const [lastClaimAt, setLastClaimAt] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<{ to: number; title: string } | null>(null);
  const lastLevel = useRef<number | null>(null);

  const load = async () => {
    const initData = window.Telegram?.WebApp?.initData || '';
    if (!initData || !walletAddress) {
      setHasNft(false);
      setEngineBalance(0);
      setUnclaimed(0);
      setMiningActive(false);
      return;
    }
    const [assetsRes, stateRes] = await Promise.all([
      fetch('/api/user/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, walletAddress }),
      }),
      fetch('/api/mining/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, walletAddress }),
      }),
    ]);
    const assets = await assetsRes.json();
    const state = await stateRes.json();
    if (assets.success) {
      setWalletBalance(Number(assets.walletBalance || 0));
      setEngineBalance(Number(assets.engineBalance || 0));
      setMiningActive(Boolean(assets.miningActive));
      setMiningSpeed(Number(assets.miningSpeed || 0));
      setLastClaimAt(assets.lastClaimAt || null);
    }
    if (state.success) setHasNft(Boolean(state.hasNft));
  };

  useEffect(() => {
    void load();
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress || !hasNft || !miningActive || !lastClaimAt) {
      setUnclaimed(0);
      return;
    }
    const tick = () => {
      const elapsedMin = Math.max(0, (Date.now() - new Date(lastClaimAt).getTime()) / 60000);
      setUnclaimed(elapsedMin * miningSpeed);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [walletAddress, hasNft, miningActive, lastClaimAt, miningSpeed]);

  const liveUnclaimed = walletAddress && hasNft && miningActive ? unclaimed : 0;
  const claimedTotal = walletBalance + engineBalance;
  const level = calculateLevel(claimedTotal);
  const progress = getLevelProgress(claimedTotal);
  const cards = getVisibleLevelCards(claimedTotal);

  useEffect(() => {
    if (lastLevel.current === null) {
      lastLevel.current = level;
      return;
    }
    if (level > lastLevel.current) {
      setLevelUp({ to: level, title: getLevelTitle(level) });
    }
    lastLevel.current = level;
  }, [level]);

  return (
    <main className="min-h-screen max-w-md mx-auto bg-black text-white px-4 py-5 font-mono pb-24">
      <LevelUpModal
        open={Boolean(levelUp)}
        level={levelUp?.to || level}
        title={levelUp?.title || getLevelTitle(level)}
        onClose={() => setLevelUp(null)}
      />
      <header className="flex items-center justify-between pb-4 border-b border-zinc-900">
        <h1 className="text-sm tracking-widest text-emerald-400">DRILL PROTOCOL</h1>
        <span className="text-[10px] text-zinc-500">
          LV {level}/{MAX_LEVEL}
        </span>
      </header>

      <section className="mt-4 bg-zinc-950 border border-emerald-500/30 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <DrillPassCard active={hasNft} compact />
          <div>
            <p className="text-[10px] text-zinc-500 tracking-widest">MINING NFT</p>
            <p className="text-sm text-white">{hasNft ? 'DRILL PASS ACTIVE' : 'NOT MINTED'}</p>
            <p className="text-[10px] text-zinc-500 mt-1">SBT on-chain testnet</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <DrillPassCard active={hasNft} />
        </div>
      </section>

      <section className="mt-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 tracking-widest">MINING LEVEL</span>
          <Trophy className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-3xl text-white mt-1">
          {level} <span className="text-sm text-zinc-500">/ {MAX_LEVEL}</span>
        </p>
        <p className="text-[10px] text-emerald-400 mt-1">{getLevelTitle(level)}</p>
        <div className="w-full bg-zinc-900 h-2 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-emerald-400" style={{ width: `${progress.progressPercent}%` }} />
        </div>
        <p className="text-[10px] text-zinc-500 mt-2">
          Next LV {progress.nextLevel}: {progress.nextLevelMinBalance.toFixed(2)} $DRILL
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
          <div className="bg-black border border-zinc-800 rounded-lg p-2 flex justify-between">
            <span className="text-zinc-500">WALLET</span>
            <span>{walletBalance.toFixed(4)}</span>
          </div>
          <div className="bg-black border border-zinc-800 rounded-lg p-2 flex justify-between">
            <span className="text-zinc-500">ENGINE</span>
            <span className="text-emerald-400">{engineBalance.toFixed(4)}</span>
          </div>
        </div>
        <div className="bg-black border border-zinc-800 rounded-lg p-2 flex justify-between text-[10px] mt-2">
          <span className="text-zinc-500">UNCLAIMED</span>
          <span className="text-amber-400">+{liveUnclaimed.toFixed(4)}</span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-3 flex items-center gap-1">
          <Wallet className="w-3 h-3" /> LEVEL TOTAL {claimedTotal.toFixed(4)} $DRILL
        </p>
        <p className="text-[10px] text-zinc-600 mt-1">Level = wallet + claimed. Unclaimed tidak dihitung.</p>
      </section>

      <section className="mt-5">
        <p className="text-[10px] tracking-widest text-zinc-500 mb-3">LEVEL CARDS</p>
        <div className="flex flex-col gap-2">
          {cards.map((card) => (
            <div
              key={card.level}
              className={`rounded-xl border p-3 ${
                card.current
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : card.unlocked
                    ? 'border-zinc-700 bg-zinc-950'
                    : 'border-zinc-900 bg-black opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">LV {card.level}</span>
                  <span className="text-xs text-white tracking-widest">{card.title}</span>
                </div>
                {card.current ? (
                  <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> CURRENT
                  </span>
                ) : (
                  <span className="text-[9px] text-zinc-500">{card.required.toFixed(1)} $DRILL</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
