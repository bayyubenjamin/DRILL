'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { Copy, CheckCircle2, User, X } from 'lucide-react';
import AppIcon, { type AppIconName } from '@/components/UI/AppIcon';
import WalletConnect from '@/components/Wallet/WalletConnect';
import EmbossCard from '@/components/UI/EmbossCard';
import SheetModal from '@/components/UI/SheetModal';
import Skeleton from '@/components/UI/Skeleton';
import SocialLinks from '@/components/UI/SocialLinks';
import { calculateLevel, getLevelProgress } from '@/lib/level/calculator';
import { formatDrill } from '@/lib/format';
import { impact } from '@/lib/telegram/haptic';

const MIN_WITHDRAW = 500;
const WITHDRAW_FEE = 70;
// 1 withdrawal per 24h per user (owner rule, 27 Nov 2026). Withdrawals
// that never paid out don't start the clock.
const WITHDRAW_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_EXEMPT = ['FAILED', 'REJECTED', 'CANCELLED'];

function formatCooldown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

// Last-known profile assets, so the rows show instantly on reopen while
// fresh data loads (stale-while-revalidate). Always overwritten by the
// server response; never trusted for longer than 7 days.
const PROFILE_CACHE_PREFIX = 'drill:profile-assets:';

function profileCacheKey() {
  const id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  return `${PROFILE_CACHE_PREFIX}${id || 'guest'}`;
}

function readProfileCache() {
  try {
    const raw = localStorage.getItem(profileCacheKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - Number(parsed.cachedAt || 0) > 7 * 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeProfileCache(data: Record<string, unknown>) {
  try {
    localStorage.setItem(profileCacheKey(), JSON.stringify({ ...data, cachedAt: Date.now() }));
  } catch {
    // ignore — cache is only a speedup
  }
}

type Withdrawal = {
  id: string;
  amount: number;
  fee: number;
  receive_amount: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  wallet_address?: string;
  tx_hash?: string | null;
};

function Row({ label, value, tone = 'white', icon }: { label: string; value: string; tone?: 'white' | 'emerald' | 'amber'; icon?: AppIconName }) {
  const color = tone === 'emerald' ? 'text-emerald-400' : tone === 'amber' ? 'text-amber-400' : 'text-zinc-100';
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 h-9">
      <span className="text-[10px] tracking-[0.18em] text-zinc-500 flex items-center gap-2">{icon && <AppIcon name={icon} size={16} />}{label}</span>
      <span className={`text-[12px] tabular-nums tracking-wide ${color}`}>{value}</span>
    </div>
  );
}

function formatTime(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusLabel(status?: string) {
  const raw = String(status || 'PENDING').toUpperCase();
  if (['SUCCESS', 'VALID', 'SENT', 'COMPLETED', 'PAID'].includes(raw)) return { text: 'VALID', tone: 'text-emerald-400' };
  if (['FAILED', 'REJECTED', 'CANCELLED'].includes(raw)) return { text: 'FAILED', tone: 'text-red-400' };
  return { text: 'PENDING', tone: 'text-amber-400' };
}

export default function ProfilePage() {
  const address = useTonAddress();
  const wallet = useTonWallet();
  const [copied, setCopied] = useState(false);
  const [tgUser, setTgUser] = useState<{ first_name?: string; last_name?: string; username?: string; photo_url?: string } | null>(null);
  // If the Telegram photo fails to load, fall back to the icon.
  const [photoFailed, setPhotoFailed] = useState(false);
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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  // Ticking clock so the cooldown countdown counts down live.
  const [now, setNow] = useState(() => Date.now());

  const initData = () => window.Telegram?.WebApp?.initData || '';

  const loadAssets = async () => {
    const payload = initData();
    if (!payload) {
      setLoading(false);
      return;
    }
    try {
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
      writeProfileCache({
        hasNft: Boolean(data.hasNft),
        engineBalance: Number(data.engineBalance || 0),
        walletBalance: Number(data.walletBalance || 0),
        miningActive: Boolean(data.miningActive),
        miningSpeed: Number(data.miningSpeed || 0),
        lastClaimAt: data.lastClaimAt || null,
        withdrawals: data.withdrawals || [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (user) setTgUser(user);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Show the last known assets instantly while fresh data loads.
    const cached = readProfileCache();
    if (cached) {
      setHasNft(Boolean(cached.hasNft));
      setEngineBalance(Number(cached.engineBalance || 0));
      setWalletBalance(Number(cached.walletBalance || 0));
      setMiningActive(Boolean(cached.miningActive));
      setMiningSpeed(Number(cached.miningSpeed || 0));
      setLastClaimAt(cached.lastClaimAt || null);
      setWithdrawals(Array.isArray(cached.withdrawals) ? cached.withdrawals : []);
      setLoading(false);
    }
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
    impact('light');
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const wdError = (() => {
    if (!wdAmount) return '';
    const amount = Number(wdAmount);
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter a valid amount';
    if (amount < MIN_WITHDRAW) return `Minimum withdraw is ${MIN_WITHDRAW} $DRILL`;
    if (amount > engineBalance) return 'Amount is more than your engine balance';
    return '';
  })();

  const submitWithdraw = async () => {
    if (wdError || !wdAmount) return;
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

  // Cooldown anchor: the latest withdrawal that actually went through
  // (withdrawals arrive newest-first from /api/user/assets).
  const lastCountedWithdrawal = useMemo(
    () => withdrawals.find((w) => !COOLDOWN_EXEMPT.includes(String(w.status || '').toUpperCase())),
    [withdrawals],
  );
  const cooldownEndsAt = lastCountedWithdrawal
    ? new Date(lastCountedWithdrawal.created_at || '').getTime() + WITHDRAW_COOLDOWN_MS
    : 0;
  const cooldownRemainingMs = Math.max(0, cooldownEndsAt - now);
  const onCooldown = cooldownRemainingMs > 0;

  const canWithdraw = Boolean(address && hasNft && engineBalance >= MIN_WITHDRAW && !onCooldown);

  return (
    <main className="min-h-screen max-w-md mx-auto text-white px-4 pt-4 pb-28 flex flex-col gap-2.5 font-mono">
      <header className="h-8 flex items-center justify-between">
        <h1 className="text-[11px] tracking-[0.28em] text-zinc-300">PROFILE</h1>
      </header>

      <EmbossCard className="px-4 py-4" accent>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full emboss emboss-inset flex items-center justify-center shrink-0 overflow-hidden">
            {tgUser?.photo_url && !photoFailed ? (
              <img src={tgUser.photo_url} alt={displayName} className="h-full w-full object-cover" onError={() => setPhotoFailed(true)} />
            ) : (
              <User className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold tracking-[0.08em] truncate uppercase">{displayName}</p>
            <p className="text-[10px] text-zinc-500 tracking-widest mt-0.5">{tgUser?.username ? `@${tgUser.username}` : 'TELEGRAM'}</p>
          </div>
          <span className={`text-[9px] tracking-[0.18em] px-2 py-1 rounded border ${hasNft ? 'text-emerald-400 border-emerald-500/35' : 'text-amber-400 border-amber-500/35'}`}>
            {hasNft ? 'SBT' : 'NO SBT'}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          {address ? <WalletConnect compact /> : <WalletConnect />}
        </div>
      </EmbossCard>

      <EmbossCard className="px-4 py-3.5">
        <div className="h-6 flex items-center justify-between mb-1">
          <p className="text-[9px] tracking-[0.28em] text-zinc-500">ASSETS</p>
          <p className="text-[9px] tracking-[0.2em] text-emerald-400">LV {level.toLocaleString()}</p>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2 py-1" aria-label="Loading assets">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <>
            <Row label="WALLET" value={formatDrill(walletBalance)} icon="wallet" />
            <Row label="ENGINE" value={formatDrill(engineBalance)} tone="emerald" icon="engine" />
            <Row label="UNCLAIMED" value={`+${formatDrill(liveUnclaimed)}`} tone="amber" icon="reward" />
          </>
        )}
        <div className="mt-2 pt-3 border-t border-white/10">
          <div className="flex items-end justify-between gap-3">
            <p className="text-[9px] tracking-[0.18em] text-zinc-500 leading-4">LEVEL BASE<br />WALLET + CLAIMED</p>
            <p className="text-[18px] leading-none text-white tabular-nums">{formatDrill(claimedTotal)}</p>
          </div>
          <div className="w-full h-1.5 rounded-full mt-2.5 overflow-hidden emboss-inset">
            <div className="h-full bg-emerald-400 transition-[width] duration-500 ease-out" style={{ width: `${progress.progressPercent}%` }} />
          </div>
        </div>
      </EmbossCard>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setWdOpen(true)} disabled={!canWithdraw} className={`emboss-btn flex-1 h-11 text-[11px] font-bold flex items-center justify-center gap-2 ${canWithdraw ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-600'}`}>
          {canWithdraw && (
            <span className="w-5 h-5 rounded-full bg-black/85 flex items-center justify-center">
              <AppIcon name="withdraw" size={14} />
            </span>
          )}
          WITHDRAW ENGINE
        </button>
        <button type="button" onClick={() => setHistoryOpen(true)} className="emboss h-11 w-11 flex items-center justify-center text-zinc-300">
          <AppIcon name="history" size={20} />
        </button>
      </div>
      {onCooldown ? (
        <p className="text-center text-[9px] tracking-[0.16em] text-amber-400">NEXT WD IN {formatCooldown(cooldownRemainingMs)}</p>
      ) : (
        <p className="text-center text-[9px] tracking-[0.16em] text-zinc-600">MIN {MIN_WITHDRAW} · FEE {WITHDRAW_FEE} · 1X / 24H</p>
      )}

      {address && (
        <EmbossCard className="px-4 py-3">
          <div className="h-6 flex items-center justify-between">
            <p className="text-[9px] tracking-[0.28em] text-zinc-500">ADDRESS</p>
            <button type="button" onClick={handleCopy} className="text-emerald-400">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-zinc-300 break-all">{address}</p>
          <p className="mt-2 text-[9px] tracking-[0.16em] text-zinc-600">{wallet?.device.appName || 'WALLET'}</p>
        </EmbossCard>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/referral" className="block">
          <EmbossCard className="h-20 px-3 flex flex-col items-center justify-center gap-1">
            <AppIcon name="friends" size={28} />
            <p className="text-[9px] tracking-[0.22em] text-zinc-500">REFERRAL</p>
            <p className="text-[11px] text-zinc-200 tracking-widest">SYSTEM</p>
          </EmbossCard>
        </Link>
        <Link href="/tasks" className="block">
          <EmbossCard className="h-20 px-3 flex flex-col items-center justify-center gap-1">
            <AppIcon name="tasks" size={28} />
            <p className="text-[9px] tracking-[0.22em] text-zinc-500">TASKS</p>
            <p className="text-[11px] text-zinc-200 tracking-widest">PROTOCOL</p>
          </EmbossCard>
        </Link>
      </div>

      <SocialLinks />

      <SheetModal open={wdOpen} onClose={() => setWdOpen(false)} label="Withdraw engine balance">
        <div className="flex justify-between items-center mb-3"><h2 className="text-xs tracking-widest text-emerald-400">WITHDRAW ENGINE</h2><button type="button" aria-label="Close withdraw" onClick={() => setWdOpen(false)}><X className="w-4 h-4 text-zinc-500" /></button></div>
        <p className="text-[10px] text-zinc-500 mb-2">Engine claimed: {formatDrill(engineBalance)} $DRILL</p>
        <input value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} inputMode="decimal" placeholder="Amount" aria-label="Withdraw amount" className="emboss emboss-inset w-full rounded-xl px-3 py-3 text-sm text-white mb-3 bg-transparent" />
        <p className="text-[10px] text-zinc-500 mb-3">Fee {WITHDRAW_FEE}. Receive {formatDrill(Math.max(0, Number(wdAmount || 0) - WITHDRAW_FEE), 2)} $DRILL</p>
        {onCooldown && <p role="status" className="text-[10px] text-amber-400 mb-3">COOLDOWN — NEXT WD IN {formatCooldown(cooldownRemainingMs)}</p>}
        {wdError && <p role="alert" className="text-[10px] text-red-400 mb-3">{wdError}</p>}
        {message && <p role="status" className="text-[10px] text-amber-400 mb-3">{message}</p>}
        <button type="button" disabled={busy || onCooldown || !address || !hasNft || !wdAmount || Boolean(wdError)} onClick={submitWithdraw} className="emboss-btn w-full py-3 bg-emerald-500 text-black text-xs font-bold disabled:opacity-50">{busy ? 'QUEUEING...' : 'CONFIRM WITHDRAW'}</button>
      </SheetModal>

      <SheetModal open={historyOpen} onClose={() => setHistoryOpen(false)} label="Withdrawal history">
        <div className="max-h-[74vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs tracking-widest text-emerald-400">WD HISTORY</h2>
            <button type="button" aria-label="Close history" onClick={() => setHistoryOpen(false)}><X className="w-4 h-4 text-zinc-500" /></button>
          </div>
          {withdrawals.length === 0 ? (
            <p className="text-[10px] text-zinc-500">No withdrawals yet.</p>
          ) : withdrawals.map((item) => {
            const st = statusLabel(item.status);
            const hash = item.tx_hash || (item as { txhash?: string }).txhash || '';
            return (
              <div key={item.id} className="border-b border-white/5 py-3 last:border-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white">{formatDrill(Number(item.amount), 2)} $DRILL</span>
                  <span className={`${st.tone} tracking-widest text-[10px] font-bold`}>{st.text}</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Receive {formatDrill(Number(item.receive_amount), 2)} · Fee {Number(item.fee).toFixed(0)}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{formatTime(item.created_at)}</p>
                {item.wallet_address && <p className="text-[10px] text-zinc-600 mt-1 break-all">{item.wallet_address}</p>}
                <p className="text-[10px] text-zinc-400 mt-1 break-all">TX {hash || '-'}</p>
              </div>
            );
          })}
        </div>
      </SheetModal>
    </main>
  );
}
