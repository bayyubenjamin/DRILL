'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Copy, CheckCircle2, ArrowLeft, Zap, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { BOT_USERNAME, FRIEND_SHARE, REFERRAL_REWARD } from '@/lib/referral/constants';
import EmbossCard from '@/components/UI/EmbossCard';
import { impact, notify } from '@/lib/telegram/haptic';

export default function ReferralPage() {
  const [stats, setStats] = useState({
    totalInvites: 0,
    pendingCount: 0,
    validCount: 0,
    validPool: 0,
    friendPool: 0,
    engineBalance: 0,
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [tgUserId, setTgUserId] = useState<number | string>('');
  const referralLink = `https://t.me/${BOT_USERNAME}/app?startapp=${tgUserId || ''}`;

  const load = useCallback(async () => {
    const initData = window.Telegram?.WebApp?.initData;
    const currentId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (currentId) setTgUserId(currentId);
    if (!initData) {
      setLoading(false);
      return;
    }
    const res = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });
    const data = await res.json();
    if (data.success) {
      setStats({
        totalInvites: data.totalInvites || 0,
        pendingCount: data.pendingCount || 0,
        validCount: data.validCount || 0,
        validPool: Number(data.validPool || 0),
        friendPool: Number(data.friendPool || 0),
        engineBalance: Number(data.engineBalance || 0),
      });
      setError('');
    } else {
      setError(data.error || 'Failed to load');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const claim = async (pool: 'valid' | 'friends') => {
    impact('heavy');
    setBusy(pool);
    try {
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: window.Telegram?.WebApp?.initData, pool }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify('error');
        setError(data.error || 'Claim failed');
        return;
      }
      notify('success');
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto text-white p-4 font-mono flex flex-col pb-24">
      <header className="flex items-center mb-6">
        <Link href="/" className="text-zinc-400 mr-4"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl tracking-widest text-emerald-500">REFERRAL SYSTEM</h1>
      </header>

      <EmbossCard className="p-4 mb-4">
        <span className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase">ENGINE BALANCE</span>
        <p className="text-2xl font-bold mt-1">{stats.engineBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })} <span className="text-xs text-emerald-400">$DRILL</span></p>
      </EmbossCard>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <EmbossCard className="p-4" accent>
          <span className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase">VALID REF POOL</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">+{stats.validPool.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-zinc-500 mt-1">+{REFERRAL_REWARD} each time a friend mints</p>
          <button
            type="button"
            disabled={stats.validPool <= 0 || busy !== null}
            onClick={() => claim('valid')}
            className="emboss-btn claim-cta w-full mt-3 py-2 text-[10px] font-bold disabled:opacity-40"
          >
            {busy === 'valid' ? 'CLAIMING' : 'CLAIM TO ENGINE'}
          </button>
        </EmbossCard>
        <EmbossCard className="p-4" accent>
          <span className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase">FRIENDS POOL</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">+{stats.friendPool.toLocaleString('en-US', { maximumFractionDigits: 4 })}</p>
          <p className="text-[10px] text-zinc-500 mt-1">{FRIEND_SHARE * 100}% of friend $DRILL claims</p>
          <button
            type="button"
            disabled={stats.friendPool <= 0 || busy !== null}
            onClick={() => claim('friends')}
            className="emboss-btn claim-cta w-full mt-3 py-2 text-[10px] font-bold disabled:opacity-40"
          >
            {busy === 'friends' ? 'CLAIMING' : 'CLAIM TO ENGINE'}
          </button>
        </EmbossCard>
      </div>

      {error && <p className="text-[10px] text-red-400 mb-3">{error}</p>}

      {loading ? (
        <div className="text-center text-zinc-500 text-sm">LOADING STATS...</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <EmbossCard className="p-3 text-center"><span className="text-zinc-500 text-[9px]">INVITES</span><p className="text-xl font-bold">{stats.totalInvites}</p></EmbossCard>
          <EmbossCard className="p-3 text-center"><span className="text-zinc-500 text-[9px] flex items-center justify-center gap-1"><Clock3 size={11} /> PENDING</span><p className="text-xl font-bold text-amber-400">{stats.pendingCount}</p></EmbossCard>
          <EmbossCard className="p-3 text-center" accent><span className="text-zinc-500 text-[9px] flex items-center justify-center gap-1"><CheckCircle2 size={11} /> VALID</span><p className="text-xl font-bold text-emerald-400">{stats.validCount}</p></EmbossCard>
        </div>
      )}

      <p className="text-[10px] text-zinc-500 leading-relaxed mb-6">
        Friend opens your link = PENDING. After they mint the pass = VALID and +{REFERRAL_REWARD} $DRILL goes to Valid Ref Pool. When that friend claims $DRILL, you get {FRIEND_SHARE * 100}% in Friends Pool. Both pools must be claimed into engine balance.
      </p>

      <EmbossCard className="p-4 mt-auto">
        <p className="text-xs text-zinc-400 mb-3 text-center uppercase tracking-wider">Your invite link</p>
        <div className="emboss emboss-inset flex items-center space-x-2 rounded p-2 mb-4">
          <div className="flex-1 truncate text-xs text-zinc-300">{referralLink}</div>
          <button onClick={() => { navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-2 rounded text-emerald-500">
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <button
          onClick={() => {
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join DRILL ENGINE and mine $DRILL with me.')}`;
            window.Telegram?.WebApp?.openTelegramLink?.(shareUrl);
          }}
          className="emboss-btn w-full bg-emerald-500 text-black font-bold tracking-widest text-sm py-3"
        >
          INVITE OPERATORS
        </button>
      </EmbossCard>
    </div>
  );
}
