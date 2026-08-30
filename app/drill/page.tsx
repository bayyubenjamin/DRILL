'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Trophy, Wallet } from 'lucide-react';
import { useTonAddress } from '@tonconnect/ui-react';
import { calculateLevel, getLevelProgress, MAX_LEVEL } from '@/lib/level/calculator';
import { getLevelTitle, getVisibleLevelCards } from '@/lib/level/ranks';
import DrillPassCard from '@/components/UI/DrillPassCard';
import EmbossCard from '@/components/UI/EmbossCard';

function StatRow({ label, value, tone = 'white' }: { label: string; value: string; tone?: 'white' | 'lime' | 'amber' }) {
  const color = tone === 'lime' ? 'text-emerald-400' : tone === 'amber' ? 'text-amber-400' : 'text-white';
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-[9px] tracking-[0.22em] text-zinc-500">{label}</span>
      <span className={`text-[12px] tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

export default function DrillPage() {
  const walletAddress = useTonAddress();
  const [hasNft, setHasNft] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [engineBalance, setEngineBalance] = useState(0);
  const [unclaimed, setUnclaimed] = useState(0);
  const [miningActive, setMiningActive] = useState(false);
  const [miningSpeed, setMiningSpeed] = useState(0);
  const [lastClaimAt, setLastClaimAt] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen max-w-md mx-auto text-white px-4 pt-4 pb-24 font-mono flex flex-col gap-3">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[9px] tracking-[0.28em] text-zinc-500">PROTOCOL</p>
          <h1 className="text-[15px] tracking-[0.18em] text-white mt-0.5">DRILL PASS</h1>
        </div>
        <span className="text-[10px] tracking-widest text-emerald-400">LV {level}/{MAX_LEVEL}</span>
      </header>

      <EmbossCard className="px-4 pt-4 pb-4" accent={hasNft}>
        <div className="flex items-start gap-3">
          <DrillPassCard active={hasNft} compact />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[8px] tracking-[0.28em] text-zinc-500">MINING NFT</p>
            <p className="text-[13px] tracking-widest text-white mt-1">{hasNft ? 'DRILL PASS ACTIVE' : 'NOT MINTED'}</p>
            <p className="text-[9px] text-zinc-500 mt-1 tracking-wide">Soulbound SBT · Testnet</p>
            <p className={`mt-2 text-[9px] tracking-widest ${hasNft ? 'text-emerald-400' : 'text-amber-400'}`}>
              {hasNft ? 'ACCESS GRANTED' : 'MINT REQUIRED'}
            </p>
          </div>
        </div>
      </EmbossCard>

      <div className="flex justify-center py-1">
        <DrillPassCard active={hasNft} />
      </div>

      <EmbossCard className="px-4 py-3.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[8px] tracking-[0.28em] text-zinc-500">MINING LEVEL</p>
            <p className="text-[34px] leading-none text-white mt-1 tabular-nums">
              {level}<span className="text-[13px] text-zinc-500"> / {MAX_LEVEL}</span>
            </p>
            <p className="text-[10px] text-emerald-400 tracking-[0.22em] mt-1.5">{getLevelTitle(level)}</p>
          </div>
          <Trophy className="w-4 h-4 text-amber-400 mt-1" />
        </div>

        <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden emboss-inset">
          <div className="lime-bar" style={{ width: `${progress.progressPercent}%` }} />
        </div>
        <p className="text-[9px] text-zinc-500 mt-2 tracking-wide">
          Next LV {progress.nextLevel} · {progress.nextLevelMinBalance.toFixed(2)} $DRILL
        </p>

        <div className="mt-3 pt-1">
          <StatRow label="WALLET" value={walletBalance.toFixed(4)} />
          <StatRow label="ENGINE" value={engineBalance.toFixed(4)} tone="lime" />
          <StatRow label="UNCLAIMED" value={`+${liveUnclaimed.toFixed(4)}`} tone="amber" />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[8px] tracking-[0.2em] text-zinc-500 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> LEVEL TOTAL
          </span>
          <span className="text-[12px] tabular-nums text-white">{claimedTotal.toFixed(4)} $DRILL</span>
        </div>
      </EmbossCard>

      <section>
        <p className="text-[8px] tracking-[0.28em] text-zinc-500 mb-2">LEVEL CARDS</p>
        <div className="flex flex-col gap-1.5">
          {cards.map((card) => (
            <div
              key={card.level}
              className={`emboss px-3 py-2.5 ${card.current ? 'emboss-accent' : ''} ${card.unlocked ? '' : 'opacity-45'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] text-zinc-500 tabular-nums w-10">LV {card.level}</span>
                  <span className="text-[11px] text-white tracking-[0.16em] truncate">{card.title}</span>
                </div>
                {card.current ? (
                  <span className="text-[8px] text-emerald-400 flex items-center gap-1 tracking-widest shrink-0">
                    <ShieldCheck className="w-3 h-3" /> NOW
                  </span>
                ) : (
                  <span className="text-[9px] text-zinc-500 tabular-nums shrink-0">{card.required.toFixed(1)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
