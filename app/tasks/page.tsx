'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Calendar,
  Share2,
  Wallet,
  Cpu,
  RefreshCw,
} from 'lucide-react';

// Tipe Data Tugas
interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'daily' | 'social' | 'onchain';
  is_completed: boolean;
  link?: string;
}

export default function TasksPage() {
  // --- State Utama ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'social' | 'onchain'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [rewardToast, setRewardToast] = useState<{ amount: number; title: string } | null>(null);
  const [userBalance, setUserBalance] = useState<number>(12482.42);

  // Load Data Tugas saat Halaman Dibuka
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Data Default (Fallback jika API Backend belum berjalan)
      const defaultTasks: Task[] = [
        {
          id: 'daily-login-id',
          title: 'Daily Drill Login',
          description: 'Log in setiap hari untuk menjaga core generator tetap aktif.',
          reward: 100,
          type: 'daily',
          is_completed: false,
        },
        {
          id: 'wallet-connect-id',
          title: 'Connect TON Testnet Wallet',
          description: 'Hubungkan dompet TON Testnet untuk persiapan alokasi $DRILL.',
          reward: 250,
          type: 'onchain',
          is_completed: false,
        },
        {
          id: 'tg-channel-id',
          title: 'Join Drill Telegram Official',
          description: 'Bergabung dengan saluran Telegram utama untuk informasi Genesis.',
          reward: 500,
          type: 'social',
          is_completed: false,
          link: 'https://t.me/drillnetwork',
        },
        {
          id: 'twitter-follow-id',
          title: 'Follow DRILL di X (Twitter)',
          description: 'Ikuti akun X resmi untuk pembaruan fitur dan event airdrop.',
          reward: 300,
          type: 'social',
          is_completed: false,
          link: 'https://x.com',
        },
        {
          id: 'mint-nft-id',
          title: 'Mint Mining NFT Pass (1 TON)',
          description: 'Dapatkan Akses Minting NFT untuk melipatgandakan kecepatan mining.',
          reward: 1000,
          type: 'onchain',
          is_completed: false,
        },
      ];

      // Simulasi fetch delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setTasks(defaultTasks);
      
    } catch (err) {
      console.error('Gagal memuat tugas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler Klaim Tugas dengan Anti Double-Claim
  const handleClaimTask = async (task: Task) => {
    // 1. Cegah klaim ulang jika tugas sudah selesai atau sedang diverifikasi
    if (task.is_completed || claimingTaskId !== null) return;

    // Buka link tugas di tab baru jika ada
    if (task.link && typeof window !== 'undefined') {
      window.open(task.link, '_blank');
    }

    setClaimingTaskId(task.id);

    try {
      // Simulasi proses klaim
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Update status tugas secara lokal
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: true } : t))
      );
      setUserBalance((prev) => prev + task.reward);
      setRewardToast({ amount: task.reward, title: task.title });

      // Haptic Feedback Simulasi
      console.log('Haptic: success');
      
    } catch (err) {
      console.error('Error saat klaim:', err);
    } finally {
      setClaimingTaskId(null);
      setTimeout(() => setRewardToast(null), 3500);
    }
  };

  // Filter Tugas Berdasarkan Tab yang Aktif
  const filteredTasks = tasks.filter((t) => (activeTab === 'all' ? true : t.type === activeTab));

  // Ikon Kategori Tugas (Pure SVG / Lucide Icons - TANPA CANVAS)
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'social':
        return <Share2 className="w-4 h-4 text-blue-400" />;
      case 'onchain':
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      default:
        return <Cpu className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <main className="min-h-screen max-w-md mx-auto bg-black text-white px-4 py-5 flex flex-col font-mono selection:bg-emerald-500 selection:text-black pb-12">
      {/* 1. Header Navigation */}
      <header className="flex items-center justify-between pb-4 border-b border-zinc-900">
        <button
          onClick={() => console.log('Navigate to Dashboard')}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>DASHBOARD</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] tracking-widest text-zinc-300 font-semibold uppercase">
            TASKS PROTOCOL
          </span>
        </div>
      </header>

      {/* 2. Notification Toast (Reward Alert) */}
      <AnimatePresence>
        {rewardToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black px-4 py-2.5 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2 font-mono text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>
              TASK COMPLETED! +{rewardToast.amount} $DRILL
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Hero / User Balance Card */}
      <section className="my-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-1">
          <span className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase">
            CURRENT DRILL BALANCE
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-emerald-400">$DRILL</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
            Selesaikan tugas ekosistem harian & sosial untuk mengakumulasi energi $DRILL sebelum Genesis Season berakhir.
          </p>
        </div>
      </section>

      {/* 4. Filter Tab Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950 border border-zinc-900 rounded-xl mb-4 text-[10px]">
        {(['all', 'daily', 'social', 'onchain'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 rounded-lg font-bold tracking-wider uppercase transition-all ${
              activeTab === tab
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 5. Daftar Tugas (Task List) */}
      <section className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
            <span>LOADING TASKS...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-500 bg-zinc-950 border border-zinc-900 rounded-xl">
            TIDAK ADA TUGAS UNTUK KATEGORI INI
          </div>
        ) : (
          filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                task.is_completed
                  ? 'bg-zinc-950/40 border-zinc-900 opacity-60'
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Detail Tugas */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                  {getTaskIcon(task.type)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-100">{task.title}</span>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-1.5">
                    <Zap className="w-3 h-3 fill-emerald-500/20" />
                    <span>+{task.reward} $DRILL</span>
                  </div>
                </div>
              </div>

              {/* Tombol Action Klaim */}
              <button
                onClick={() => handleClaimTask(task)}
                disabled={task.is_completed || claimingTaskId === task.id}
                className={`shrink-0 px-3 py-2 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-all ${
                  task.is_completed
                    ? 'bg-zinc-900 text-emerald-400 border border-emerald-500/20 cursor-default'
                    : claimingTaskId === task.id
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                }`}
              >
                {task.is_completed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DONE</span>
                  </>
                ) : claimingTaskId === task.id ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>VERIFY...</span>
                  </>
                ) : (
                  <>
                    <span>CLAIM</span>
                    <ExternalLink className="w-3 h-3" />
                  </>
                )}
              </button>
            </motion.div>
          ))
        )}
      </section>
    </main>
  );
}
