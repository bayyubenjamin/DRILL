'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, CheckCircle2, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';

// Inisialisasi WebApp secara dinamis untuk menghindari error "window is not defined" saat Vercel build (SSR)
const WebApp = typeof window !== 'undefined' ? require('@twa-dev/sdk').default : null;

export default function ReferralPage() {
  const [stats, setStats] = useState({ totalInvites: 0, totalEarned: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ganti dengan username bot Telegram Anda
  const BOT_USERNAME = 'DrillEngineBot'; 
  const tgUserId = WebApp?.initDataUnsafe?.user?.id;
  const referralLink = `https://t.me/${BOT_USERNAME}/app?startapp=${tgUserId || ''}`;

  useEffect(() => {
    const initReferral = async () => {
      try {
        if (!WebApp || !WebApp.initData) return;

        // Cek apakah user masuk menggunakan link referral (startapp)
        const startParam = WebApp.initDataUnsafe?.start_param;
        if (startParam && startParam !== tgUserId?.toString()) {
          // Proses klaim referral di background
          fetch('/api/referral/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: WebApp.initData, referrerTgId: startParam })
          }).catch(console.error);
        }

        // Ambil data statistik referral
        const res = await fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: WebApp.initData })
        });
        const data = await res.json();
        if (data.success) setStats({ totalInvites: data.totalInvites, totalEarned: data.totalEarned });
      } finally {
        setLoading(false);
      }
    };

    initReferral();
  }, [tgUserId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    WebApp?.HapticFeedback?.notificationOccurred('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = `Join the DRILL NETWORK Genesis Season and mine $DRILL with me!`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    WebApp?.openTelegramLink(shareUrl);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono flex flex-col">
      <header className="flex items-center mb-8">
        <Link href="/" className="text-zinc-400 hover:text-white mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl tracking-widest text-emerald-500">REFERRAL SYSTEM</h1>
      </header>

      {/* Visualisasi Transfer Energi */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-6 rounded-lg mb-8 relative overflow-hidden">
        <div className="flex flex-col items-center z-10">
          <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-emerald-500 flex items-center justify-center">
            <Users className="text-emerald-500" size={20} />
          </div>
          <span className="text-xs mt-2 text-zinc-400">FRIEND</span>
        </div>

        {/* Garis & Partikel Animasi */}
        <div className="flex-1 h-[2px] bg-zinc-800 mx-4 relative flex items-center justify-center z-0">
           <motion.div
            initial={{ left: 0, opacity: 0 }}
            animate={{ left: '100%', opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] -translate-x-1/2 flex items-center justify-center"
          >
            <Zap size={8} className="text-black" />
          </motion.div>
          <span className="absolute -top-4 text-[10px] text-emerald-500 font-bold tracking-widest">+500 $DRILL</span>
        </div>

        <div className="flex flex-col items-center z-10">
          <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Zap className="text-emerald-500" size={20} />
          </div>
          <span className="text-xs mt-2 text-emerald-400 font-bold">YOU</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 animate-pulse text-sm">LOADING STATS...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-col items-center justify-center">
            <span className="text-zinc-500 text-xs mb-1">TOTAL INVITES</span>
            <span className="text-2xl font-bold text-white">{stats.totalInvites}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-col items-center justify-center">
            <span className="text-zinc-500 text-xs mb-1">TOTAL EARNED</span>
            <span className="text-xl font-bold text-emerald-400">+{stats.totalEarned}</span>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg mt-auto">
        <p className="text-xs text-zinc-400 mb-3 text-center uppercase tracking-wider">Your Unique Extraction Link</p>
        <div className="flex items-center space-x-2 bg-black border border-zinc-800 rounded p-2 mb-4">
          <div className="flex-1 truncate text-xs text-zinc-300 select-all">
            {referralLink}
          </div>
          <button 
            onClick={handleCopy}
            className="p-2 bg-zinc-800 rounded text-emerald-500 hover:bg-zinc-700 transition-colors"
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <button 
          onClick={handleShare}
          className="w-full bg-emerald-500 text-black font-bold tracking-widest text-sm py-3 rounded-lg hover:bg-emerald-400 transition-colors"
        >
          INVITE OPERATORS
        </button>
      </div>
    </div>
  );
}
