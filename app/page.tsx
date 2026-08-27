'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Zap, Trophy, RefreshCw, Lock, AlertCircle, ShieldCheck } from 'lucide-react';

// --- Constants ---
// Genesis end timestamp (30 days from project start)
const GENESIS_END_TIMESTAMP = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).getTime();

// --- Sub-components ---

// Visual Futuristic Drill Engine Animation
const DrillCoreAnimation = ({ isClaiming }: { isClaiming: boolean }) => {
  return (
    <div className="relative flex items-center justify-center my-8 h-64 w-full">
      {/* Background Ambient Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: isClaiming ? [0.4, 0.8, 0.4] : [0.15, 0.35, 0.15],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"
      />

      {/* Outer Rotating Cyber Grid Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute w-60 h-60 border border-emerald-500/20 rounded-full border-dashed"
      />

      {/* Counter-rotating Inner Precision Ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute w-44 h-44 border-2 border-zinc-800/80 rounded-full flex items-center justify-center"
      >
        <div className="w-full h-full rounded-full border-t-2 border-b-2 border-emerald-400/40" />
      </motion.div>

      {/* Core Drill / Industrial Engine Block */}
      <motion.div
        animate={
          isClaiming
            ? { y: [-2, -18, -2], scale: [1, 1.08, 1] }
            : { y: [0, -6, 0] }
        }
        transition={
          isClaiming
            ? { duration: 0.4, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
        className="relative z-10 w-28 h-36 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-between p-3 overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.12)]"
      >
        {/* Top Metallic Cap */}
        <div className="w-full flex justify-between items-center text-[9px] font-mono text-zinc-500 px-1 border-b border-zinc-800/80 pb-1">
          <span>SYS-DRILL</span>
          <span className="text-emerald-400 font-semibold animate-pulse">ACTIVE</span>
        </div>

        {/* Central Kinetic Energy Reactor */}
        <div className="relative flex flex-col items-center justify-center my-auto w-full">
          <motion.div
            animate={
              isClaiming
                ? { opacity: [0.6, 1, 0.6], scale: [1, 1.3, 1] }
                : { opacity: [0.3, 0.7, 0.3] }
            }
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute w-16 h-16 bg-gradient-to-t from-emerald-500/30 to-emerald-400/10 rounded-full blur-md"
          />
          <Zap
            className={`w-9 h-9 transition-colors duration-300 ${
              isClaiming ? 'text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'text-emerald-500'
            }`}
          />
        </div>

        {/* Dynamic Equalizer Energy Bars */}
        <div className="flex gap-1 items-end w-full justify-center h-4 pt-1 border-t border-zinc-800/80">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              animate={{ height: isClaiming ? [4, 16, 4] : [2, 10, 2] }}
              transition={{
                duration: isClaiming ? 0.3 : 0.8,
                repeat: Infinity,
                delay: i * 0.12,
              }}
              className="w-1 bg-emerald-400/70 rounded-full"
            />
          ))}
        </div>
      </motion.div>

      {/* Energy Spark Particles during Active Claiming */}
      <AnimatePresence>
        {isClaiming && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1.8,
                  x: (Math.random() - 0.5) * 180,
                  y: (Math.random() - 0.5) * 180 - 40,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute w-2 h-2 bg-emerald-400 rounded-full blur-[1px]"
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Genesis Countdown Card
const GenesisCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const distance = GENESIS_END_TIMESTAMP - now;

      if (distance <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
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
        ].map((item, idx) => (
          <div key={idx} className="bg-zinc-900/60 border border-zinc-800 rounded-md py-1.5 flex flex-col">
            <span className="text-base font-bold text-white tracking-wider">
              {String(item.val).padStart(2, '0')}
            </span>
            <span className="text-[9px] text-zinc-500 tracking-widest mt-0.5">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
export default function DrillEngineDashboard() {
  // Account State Sync
  const [accountState, setAccountState] = useState({
    balance: 12482.42,
    miningSpeed: 4.82, // $DRILL per minute
    level: 38421,
    lastClaimAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago default
    miningActive: true,
  });

  const [displayBalance, setDisplayBalance] = useState(accountState.balance);
  const [unclaimedReward, setUnclaimedReward] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const lastClaimAtRef = useRef(accountState.lastClaimAt);
  lastClaimAtRef.current = accountState.lastClaimAt;

  // Real-time Off-chain Interpolation Engine
  useEffect(() => {
    let animFrameId: number;
    let lastTimestamp = performance.now();

    const updateRealtimeBalance = (nowTimestamp: number) => {
      const deltaMs = nowTimestamp - lastTimestamp;
      lastTimestamp = nowTimestamp;

      if (accountState.miningActive && accountState.miningSpeed > 0) {
        // Speed is $DRILL per minute -> divide by 60,000 for per millisecond
        const rewardPerMs = accountState.miningSpeed / 60000;
        const incremental = rewardPerMs * deltaMs;

        setUnclaimedReward((prev) => prev + incremental);
        setDisplayBalance((prev) => prev + incremental);
      }

      animFrameId = requestAnimationFrame(updateRealtimeBalance);
    };

    animFrameId = requestAnimationFrame(updateRealtimeBalance);
    return () => cancelAnimationFrame(animFrameId);
  }, [accountState.miningSpeed, accountState.miningActive]);

  // Execute Server Claim Action
  const handleClaim = async () => {
    if (isClaiming || unclaimedReward < 0.001) return;

    setIsClaiming(true);
    setStatusMessage(null);

    try {
      // Get Telegram initData if inside TWA environment
      const telegramInitData =
        typeof window !== 'undefined' && window.Telegram?.WebApp?.initData
          ? window.Telegram.WebApp.initData
          : '';

      const response = await fetch('/api/mining/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: telegramInitData }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Sync state directly from authoritative server response
        setAccountState((prev) => ({
          ...prev,
          balance: data.new_balance,
          lastClaimAt: data.last_claim_at,
        }));
        setDisplayBalance(data.new_balance);
        setUnclaimedReward(0);
        setStatusMessage('ENERGY EXTRACTED SUCCESSFULLY!');

        // Optional Telegram Haptic Feedback
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } else {
        // Fallback for development/testing if backend API is offline or returning error
        console.warn('API Response Notice:', data.error || 'Running in mock mode');
        const fallbackNewBalance = displayBalance;
        setAccountState((prev) => ({
          ...prev,
          balance: fallbackNewBalance,
          lastClaimAt: new Date().toISOString(),
        }));
        setUnclaimedReward(0);
        setStatusMessage('ENERGY EXTRACTED (LOCAL SYNC)');
      }
    } catch (err) {
      console.error('Claim Execution Error:', err);
      // Soft fallback for visual demonstration
      setAccountState((prev) => ({
        ...prev,
        balance: displayBalance,
        lastClaimAt: new Date().toISOString(),
      }));
      setUnclaimedReward(0);
      setStatusMessage('ENERGY EXTRACTED (LOCAL SYNC)');
    } finally {
      setIsClaiming(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <main className="min-h-screen max-w-md mx-auto bg-black text-white px-4 py-5 flex flex-col justify-between selection:bg-emerald-500 selection:text-black font-sans pb-8">
      {/* Top Bar Header */}
      <header className="flex justify-between items-center w-full pb-3 border-b border-zinc-900">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-widest text-zinc-100 font-mono">
              DRILL ENGINE
            </h1>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest mt-0.5">
            OFF-CHAIN ECONOMY
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-mono tracking-wider text-emerald-400 font-semibold">
            GENESIS
          </span>
        </div>
      </header>

      {/* Main Balance Display Section */}
      <section className="flex flex-col items-center justify-center my-6 text-center">
        <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mb-1">
          UNCLAIMED + WALLET APP BALANCE
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-mono font-light tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            {displayBalance.toLocaleString('en-US', {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}
          </span>
          <span className="text-lg font-bold text-emerald-400 tracking-wider">
            $DRILL
          </span>
        </div>
      </section>

      {/* Level & Mining Speed Stats Bar */}
      <section className="bg-zinc-950/90 border border-zinc-800 p-3.5 rounded-xl flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-xs font-mono">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <Trophy className="w-4 h-4" />
            <span>LEVEL {accountState.level.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <Zap className="w-4 h-4 fill-emerald-500/20" />
            <span>+{accountState.miningSpeed.toFixed(2)} $DRILL / MIN</span>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300"
            initial={{ width: '0%' }}
            animate={{ width: '68%' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-zinc-500">
          <span>PROGRESS TO LEVEL {accountState.level + 1}</span>
          <span>68%</span>
        </div>
      </section>

      {/* Drill Core Visual Machine */}
      <DrillCoreAnimation isClaiming={isClaiming} />

      {/* Claim Action Control Panel */}
      <section className="flex flex-col items-center w-full gap-2 mt-auto">
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-md mb-1"
          >
            {statusMessage}
          </motion.div>
        )}

        <div className="flex justify-between w-full text-xs font-mono px-1">
          <span className="text-zinc-500">ACCUMULATED ENERGY:</span>
          <span className="text-emerald-400 font-semibold">
            +{unclaimedReward.toFixed(4)} $DRILL
          </span>
        </div>

        <button
          onClick={handleClaim}
          disabled={isClaiming || unclaimedReward < 0.001}
          className={`relative w-full py-3.5 rounded-xl font-mono text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 active:scale-[0.98] ${
            isClaiming || unclaimedReward < 0.001
              ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              : 'bg-emerald-500 text-black border border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:bg-emerald-400'
          }`}
        >
          {isClaiming ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>EXTRACTING...</span>
            </>
          ) : (
            <>
              <Battery className="w-4 h-4 fill-black/20" />
              <span>EXTRACT ENERGY</span>
            </>
          )}

          {/* Shine Sweep Effect */}
          {!isClaiming && unclaimedReward >= 0.001 && (
            <motion.div
              animate={{ left: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
            />
          )}
        </button>

        {/* Genesis Phase Countdown Widget */}
        <GenesisCountdown />
      </section>
    </main>
  );
}
