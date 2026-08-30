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
import Link from 'next/link';
import EmbossCard from '@/components/UI/EmbossCard';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'social' | 'onchain'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [rewardToast, setRewardToast] = useState<{ amount: number; title: string } | null>(null);
  const [userBalance, setUserBalance] = useState<number>(12482.42);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const defaultTasks: Task[] = [
        { id: 'daily-login-id', title: 'Daily Drill Login', description: 'Log in setiap hari untuk menjaga core generator tetap aktif.', reward: 100, type: 'daily', is_completed: false },
        { id: 'wallet-connect-id', title: 'Connect TON Testnet Wallet', description: 'Hubungkan dompet TON Testnet untuk persiapan alokasi $DRILL.', reward: 250, type: 'onchain', is_completed: false },
        { id: 'tg-channel-id', title: 'Join Drill Telegram Official', description: 'Bergabung dengan saluran Telegram utama untuk informasi Genesis.', reward: 500, type: 'social', is_completed: false, link: 'https://t.me/drillnetwork' },
        { id: 'twitter-follow-id', title: 'Follow DRILL di X (Twitter)', description: 'Ikuti akun X resmi untuk pembaruan fitur dan event airdrop.', reward: 300, type: 'social', is_completed: false, link: 'https://x.com' },
        { id: 'mint-nft-id', title: 'Mint Mining NFT Pass (1 TON)', description: 'Dapatkan Akses Minting NFT untuk melipatgandakan kecepatan mining.', reward: 1000, type: 'onchain', is_completed: false },
      ];
      await new Promise((resolve) => setTimeout(resolve, 800));
      setTasks(defaultTasks);
    } catch (err) {
      console.error('Gagal memuat tugas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimTask = async (task: Task) => {
    if (task.is_completed || claimingTaskId !== null) return;
    if (task.link && typeof window !== 'undefined') window.open(task.link, '_blank');
    setClaimingTaskId(task.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_completed: true } : t)));
      setUserBalance((prev) => prev + task.reward);
      setRewardToast({ amount: task.reward, title: task.title });
    } catch (err) {
      console.error('Error saat klaim:', err);
    } finally {
      setClaimingTaskId(null);
      setTimeout(() => setRewardToast(null), 3500);
    }
  };

  const filteredTasks = tasks.filter((t) => (activeTab === 'all' ? true : t.type === activeTab));

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
    <main className="min-h-screen max-w-md mx-auto text-white px-4 py-5 flex flex-col font-mono pb-12">
      <header className="flex items-center justify-between pb-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 text-xs text-zinc-400">
          <ArrowLeft className="w-4 h-4" />
          <span>DASHBOARD</span>
        </Link>
        <div className="emboss emboss-accent px-2.5 py-1 rounded-md flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] tracking-widest text-zinc-300 font-semibold uppercase">TASKS PROTOCOL</span>
        </div>
      </header>

      <AnimatePresence>
        {rewardToast && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black px-4 py-2.5 rounded-xl flex items-center gap-2 font-mono text-xs font-bold">
            <Sparkles className="w-4 h-4 fill-black" />
            <span>TASK COMPLETED! +{rewardToast.amount} $DRILL</span>
          </motion.div>
        )}
      </AnimatePresence>

      <EmbossCard className="my-4 p-4">
        <span className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase">CURRENT DRILL BALANCE</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold tracking-tight text-white">{userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <span className="text-xs font-bold text-emerald-400">$DRILL</span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">Selesaikan tugas ekosistem harian & sosial untuk mengakumulasi energi $DRILL.</p>
      </EmbossCard>

      <EmbossCard className="mb-4 p-1 grid grid-cols-4 gap-1">
        {(['all', 'daily', 'social', 'onchain'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 rounded-lg text-[9px] font-bold tracking-wider uppercase ${
              activeTab === tab ? 'bg-emerald-500 text-black' : 'text-zinc-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </EmbossCard>

      <section className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
            <span>LOADING TASKS...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmbossCard className="text-center py-10 text-xs text-zinc-500">TIDAK ADA TUGAS UNTUK KATEGORI INI</EmbossCard>
        ) : (
          filteredTasks.map((task) => (
            <EmbossCard key={task.id} className={`p-3.5 ${task.is_completed ? 'opacity-60' : ''}`} accent={!task.is_completed}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="emboss emboss-inset p-2.5 rounded-lg shrink-0">{getTaskIcon(task.type)}</div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-zinc-100">{task.title}</span>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">{task.description}</p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-1.5">
                      <Zap className="w-3 h-3" />
                      <span>+{task.reward} $DRILL</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleClaimTask(task)} disabled={task.is_completed || claimingTaskId === task.id} className={`emboss-btn shrink-0 px-3 py-2 text-[10px] font-bold ${task.is_completed ? 'bg-zinc-900 text-emerald-400' : claimingTaskId === task.id ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500 text-black'}`}>
                  {task.is_completed ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> DONE</span> : claimingTaskId === task.id ? <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> VERIFY</span> : <span className="flex items-center gap-1">CLAIM <ExternalLink className="w-3 h-3" /></span>}
                </button>
              </div>
            </EmbossCard>
          ))
        )}
      </section>
    </main>
  );
}
