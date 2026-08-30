'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, CheckCircle2, ArrowLeft, Zap, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { BOT_USERNAME, REFERRAL_REWARD } from '@/lib/referral/constants';
import EmbossCard from '@/components/UI/EmbossCard';

export default function ReferralPage() {
  const [stats, setStats] = useState({ totalInvites: 0, pendingCount: 0, validCount: 0, totalEarned: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tgUserId, setTgUserId] = useState<number | string>('');
  const referralLink = `https://t.me/${BOT_USERNAME}/app?startapp=${tgUserId || ''}`;

  useEffect(() => {
    const run = async () => {
      try {
        const initData = window.Telegram?.WebApp?.initData;
        const currentId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (currentId) setTgUserId(currentId);
        if (!initData) return;
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
            totalEarned: data.totalEarned || 0,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  return (
    <div className="min-h-screen max-w-md mx-auto text-white p-4 font-mono flex flex-col pb-24">
      <header className="flex items-center mb-8">
        <Link href="/" className="text-zinc-400 mr-4"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl tracking-widest text-emerald-500">REFERRAL SYSTEM</h1>
      </header>

      <EmbossCard className="p-6 mb-6 flex items-center justify-between gap-3">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-12 h-12 rounded-full emboss flex items-center justify-center"><Users className="text-emerald-500" size={20} /></div>
          <span className="text-[10px] mt-2 text-zinc-400">FRIEND</span>
        </div>
        <div className="flex-1 h-[2px] bg-zinc-800 relative flex items-center justify-center min-w-0">
          <motion.div animate={{ left: ['0%', '92%'] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute w-3 h-3 rounded-full bg-emerald-500" />
          <span className="absolute -top-4 text-[10px] text-emerald-500 font-bold">+{REFERRAL_REWARD}</span>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <div className="w-12 h-12 rounded-full emboss flex items-center justify-center"><Zap className="text-emerald-500" size={20} /></div>
          <span className="text-[10px] mt-2 text-emerald-400 font-bold">YOU</span>
        </div>
      </EmbossCard>

      {loading ? (
        <div className="text-center text-zinc-500 text-sm">LOADING STATS...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <EmbossCard className="p-4 text-center"><span className="text-zinc-500 text-xs">TOTAL INVITES</span><p className="text-2xl font-bold">{stats.totalInvites}</p></EmbossCard>
          <EmbossCard className="p-4 text-center" accent><span className="text-zinc-500 text-xs">TOTAL EARNED</span><p className="text-xl font-bold text-emerald-400">+{stats.totalEarned}</p></EmbossCard>
          <EmbossCard className="p-4 text-center"><span className="text-zinc-500 text-xs flex items-center justify-center gap-1"><Clock3 size={12} /> PENDING</span><p className="text-xl font-bold text-amber-400">{stats.pendingCount}</p></EmbossCard>
          <EmbossCard className="p-4 text-center" accent><span className="text-zinc-500 text-xs flex items-center justify-center gap-1"><CheckCircle2 size={12} /> VALID</span><p className="text-xl font-bold text-emerald-400">{stats.validCount}</p></EmbossCard>
        </div>
      )}

      <p className="text-[10px] text-zinc-500 leading-relaxed mb-6">
        Link: t.me/{BOT_USERNAME}. Teman buka link = PENDING. Setelah teman mint SBT = VALID +{REFERRAL_REWARD} $DRILL.
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
