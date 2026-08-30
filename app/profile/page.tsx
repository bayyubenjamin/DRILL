'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { Copy, CheckCircle2, History, User, X } from 'lucide-react';
import WalletConnect from '@/components/Wallet/WalletConnect';
import EmbossCard from '@/components/UI/EmbossCard';
import { calculateLevel, getLevelProgress } from '@/lib/level/calculator';

const MIN_WITHDRAW = 500;
const WITHDRAW_FEE = 70;

type Withdrawal = { id: string; amount: number; fee: number; receive_amount: number; status: string };

function Row({ label, value, tone = 'white' }: { label: string; value: string; tone?: 'white' | 'emerald' | 'amber' }) {
  const color = tone === 'emerald' ? 'text-emerald-400' : tone === 'amber' ? 'text-amber-400' : 'text-white';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] tracking-widest text-zinc-500">{label}</span>
      <span className={`text-[11px] tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const address = useTonAddress();
  const wallet = useTonWallet();
  const [copied, setCopied] = useState(false);
  const [tgUser, setTgUser] = useState<{ first_name?: string; last_name?: string; username?: string } | null>(null);
  const [hasNft, setHasNft] = useState(false);
  const [engineBalance, setEngineBalance] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [unclaimed, setUnclaimed] = useState(0);
  const [miningActive, setMiningActive] = useState(false);
  const [miningSpeed, setMiningSpeed] = useState(0);
  const [lastClaimAt, setLastClaimAt] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wdOpen, setWdOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [wdAmount, setWdAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initData = () => window.Telegram?.WebApp?.initData || '';

  const loadAssets = async () => {
    const payload = initData();
    if (!payload || !address) {
      setHasNft(false);
      setEngineBalance(0);
      setUnclaimed(0);
      setMiningActive(false);
      return;
    }
    const res = await fetch('/api/user/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: payload, walletAddress: address }),
    });
    const data = await res.json();
    if (!data.success) return;
    setHasNft(Boolean(data.hasNft));
    setEngineBalance(Number(data.engineBalance || 0));
    setWalletBalance(Number(data.walletBalance || 0));
    setMiningActive(Boolean(data.miningActive));
    setMiningSpeed(Number(data.miningSpeed || 0));
    setLastClaimAt(data.lastClaimAt || null);
    setWithdrawals(data.withdrawals || []);
  };

  useEffect(() => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (user) setTgUser(user);
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [address]);

  useEffect(() => {
    if (!address || !hasNft || !miningActive || !lastClaimAt) {
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
  }, [address, hasNft, miningActive, lastClaimAt, miningSpeed]);

  const liveUnclaimed = address && hasNft && miningActive ? unclaimed : 0;
  const claimedTotal = walletBalance + engineBalance;
  const level = calculateLevel(claimedTotal);
  const progress = getLevelProgress(claimedTotal);
  const displayName = useMemo(() => {
    if (!tgUser) return 'OPERATOR';
    return [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'OPERATOR';
  }, [tgUser]);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const submitWithdraw = async () => {
    const amount = Number(wdAmount);
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initData(), amount, walletAddress: address }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'WITHDRAW FAILED');
        return;
      }
      setMessage(`QUEUED. RECEIVE ${Number(data.receiveAmount).toFixed(2)} $DRILL`);
      setWdAmount('');
      await loadAssets();
    } catch {
      setMessage('NETWORK ERROR');
    } finally {
      setBusy(false);
    }
  };

  const canWithdraw = Boolean(address && hasNft && engineBalance >= MIN_WITHDRAW);

  return (
    <main className="min-h-screen max-w-md mx-auto text-white px-4 pt-3 pb-24 flex flex-col gap-3 font-mono">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[9px] tracking-[0.28em] text-zinc-500">OPERATOR</p>
          <h1 className="text-sm tracking-[0.18em] text-zinc-100 mt-0.5">PROFILE</h1>
        </div>
        <button type="button" onClick={() => setHistoryOpen(true)} className="text-zinc-500 p-1">
          <History className="w-4 h-4" />
        </button>
      </header>

      <EmbossCard className="px-4 py-3.5" accent>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full emboss emboss-inset flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-wide truncate">{displayName}</p>
            <p className="text-[10px] text-zinc-500 tracking-widest">{tgUser?.username ? `@${tgUser.username}` : 'TELEGRAM IDENTITY'}</p>
          </div>
          <span className={`text-[9px] tracking-widest px-2 py-1 rounded border ${hasNft ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>
            {hasNft ? 'SBT' : 'NO SBT'}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/8">
          <WalletConnect compact />
        </div>
      </EmbossCard>

      <EmbossCard className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] tracking-[0.28em] text-zinc-500">ASSETS</p>
          <p className="text-[9px] tracking-widest text-emerald-400">LV {level.toLocaleString()}</p>
        </div>
        <Row label="WALLET" value={walletBalance.toFixed(4)} />
        <Row label="ENGINE" value={engineBalance.toFixed(4)} tone="emerald" />
        <Row label="UNCLAIMED" value={`+${liveUnclaimed.toFixed(4)}`} tone="amber" />
        <div className="pt-3">
          <div className="flex items-end justify-between">
            <p className="text-[9px] tracking-widest text-zinc-500">LEVEL BASE</p>
            <p className="text-lg leading-none text-white tabular-nums">{claimedTotal.toFixed(4)}</p>
          </div>
          <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden emboss-inset">
            <div className="h-full bg-emerald-400" style={{ width: `${progress.progressPercent}%` }} />
          </div>
        </div>
      </EmbossCard>

      <button type="button" onClick={() => setWdOpen(true)} disabled={!canWithdraw} className={`emboss-btn w-full py-3 text-[11px] font-bold ${canWithdraw ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-600'}`}>
        WITHDRAW ENGINE
      </button>
      <p className="text-center text-[9px] tracking-widest text-zinc-600 -mt-1">MIN {MIN_WITHDRAW} · FEE {WITHDRAW_FEE} $DRILL</p>

      {address && (
        <EmbossCard className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] tracking-[0.28em] text-zinc-500">ADDRESS</p>
            <button type="button" onClick={handleCopy} className="text-emerald-400">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
          </div>
          <p className="text-[10px] leading-relaxed text-zinc-300 break-all">{address}</p>
          <p className="text-[9px] text-zinc-600 mt-2 tracking-widest">{wallet?.device.appName || 'WALLET'} · TESTNET</p>
        </EmbossCard>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link href="/referral"><EmbossCard className="px-3 py-3 text-center"><p className="text-[9px] tracking-widest text-zinc-500">REFERRAL</p><p className="text-[11px] text-zinc-200 mt-1">SYSTEM</p></EmbossCard></Link>
        <Link href="/tasks"><EmbossCard className="px-3 py-3 text-center"><p className="text-[9px] tracking-widest text-zinc-500">TASKS</p><p className="text-[11px] text-zinc-200 mt-1">PROTOCOL</p></EmbossCard></Link>
      </div>

      {wdOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={() => setWdOpen(false)}>
          <div className="emboss w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><h2 className="text-xs tracking-widest text-emerald-400">WITHDRAW ENGINE</h2><button type="button" onClick={() => setWdOpen(false)}><X className="w-4 h-4 text-zinc-500" /></button></div>
            <p className="text-[10px] text-zinc-500 mb-2">Engine claimed: {engineBalance.toFixed(4)} $DRILL</p>
            <input value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} inputMode="decimal" placeholder="Amount" className="emboss emboss-inset w-full rounded-xl px-3 py-3 text-sm text-white mb-3 bg-transparent" />
            <p className="text-[10px] text-zinc-500 mb-3">Fee {WITHDRAW_FEE}. Receive {Math.max(0, Number(wdAmount || 0) - WITHDRAW_FEE).toFixed(2)} $DRILL</p>
            {message && <p className="text-[10px] text-amber-400 mb-3">{message}</p>}
            <button type="button" disabled={busy || !address || !hasNft} onClick={submitWithdraw} className="emboss-btn w-full py-3 bg-emerald-500 text-black text-xs font-bold disabled:opacity-50">{busy ? 'QUEUEING...' : 'CONFIRM WITHDRAW'}</button>
          </div>
        </div>, document.body)}

      {historyOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-end sm:items-center justify-center p-4" onClick={() => setHistoryOpen(false)}>
          <div className="emboss w-full max-w-sm p-4 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><h2 className="text-xs tracking-widest text-emerald-400">WD HISTORY</h2><button type="button" onClick={() => setHistoryOpen(false)}><X className="w-4 h-4 text-zinc-500" /></button></div>
            {withdrawals.length === 0 ? <p className="text-[10px] text-zinc-500">No withdrawals yet.</p> : withdrawals.map((item) => (
              <div key={item.id} className="border-b border-white/5 py-3 last:border-0">
                <div className="flex justify-between text-xs"><span className="text-white">{Number(item.amount).toFixed(2)} $DRILL</span><span className="text-emerald-400">{item.status}</span></div>
                <p className="text-[10px] text-zinc-500 mt-1">Receive {Number(item.receive_amount).toFixed(2)} · Fee {Number(item.fee).toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>, document.body)}
    </main>
  );
}
