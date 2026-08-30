'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { impact, notify } from '@/lib/telegram/haptic';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'daily' | 'social' | 'onchain' | string;
  link?: string | null;
  is_completed: boolean;
  started: boolean;
  started_at?: string | null;
  can_claim: boolean;
  remaining_ms: number;
}

function formatWait(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'social' | 'onchain'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rewardToast, setRewardToast] = useState<{ amount: number; title: string } | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');

  const initData = () => window.Telegram?.WebApp?.initData || '';

  const loadTasks = async () => {
    const payload = initData();
    if (!payload) {
      setIsLoading(false);
      setError('Open inside Telegram');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load tasks');
        return;
      }
      setTasks(data.tasks || []);
      setUserBalance(Number(data.balance || 0));
      setError('');
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingOf = (task: Task) => {
    if (task.is_completed || !task.started || !task.started_at) return task.remaining_ms;
    return Math.max(0, 60_000 - (now - new Date(task.started_at).getTime()));
  };

  const startTask = async (task: Task) => {
    if (task.is_completed || busyId) return;
    impact('medium');
    if (task.link) window.open(task.link, '_blank');
    setBusyId(task.id);
    try {
      const res = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initData(), taskId: task.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify('error');
        setError(data.error || 'Failed to start task');
        return;
      }
      await loadTasks();
    } catch {
      notify('error');
      setError('Network error');
    } finally {
      setBusyId(null);
    }
  };

  const claimTask = async (task: Task) => {
    if (!task.can_claim && remainingOf(task) > 0) return;
    if (task.is_completed || busyId) return;
    impact('heavy');
    setBusyId(task.id);
    try {
      const res = await fetch('/api/tasks/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: initData(), taskId: task.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify('error');
        setError(data.error || 'Claim failed');
        await loadTasks();
        return;
      }
      notify('success');
      setUserBalance(Number(data.new_balance || userBalance + 5));
      setRewardToast({ amount: Number(data.reward || 5), title: task.title });
      await loadTasks();
      setTimeout(() => setRewardToast(null), 3200);
    } catch {
      notify('error');
      setError('Network error');
    } finally {
      setBusyId(null);
    }
  };

  const filteredTasks = useMemo(
    () => tasks.filter((t) => (activeTab === 'all' ? true : t.type === activeTab)),
    [tasks, activeTab],
  );

  const getTaskIcon = (type: string) => {
    if (type === 'daily') return <Calendar className="w-4 h-4 text-amber-400" />;
    if (type === 'social') return <Share2 className="w-4 h-4 text-blue-400" />;
    if (type === 'onchain') return <Wallet className="w-4 h-4 text-emerald-400" />;
    return <Cpu className="w-4 h-4 text-zinc-400" />;
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black px-4 py-2.5 rounded-xl flex items-center gap-2 font-mono text-xs font-bold">
            <Sparkles className="w-4 h-4 fill-black" />
            <span>TASK COMPLETED! +{rewardToast.amount} $DRILL</span>
          </motion.div>
        )}
      </AnimatePresence>

      <EmbossCard className="my-4 p-4">
        <span className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase">ENGINE BALANCE</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold tracking-tight text-white">{userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <span className="text-xs font-bold text-emerald-400">$DRILL</span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">Open the task link first. Claim appears after 1 minute. Each task pays 5 $DRILL.</p>
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

      {error && <p className="text-[10px] text-red-400 mb-2 tracking-wide">{error}</p>}

      <section className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
            <span>LOADING TASKS...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmbossCard className="text-center py-10 text-xs text-zinc-500">NO TASKS IN THIS CATEGORY</EmbossCard>
        ) : (
          filteredTasks.map((task) => {
            const wait = remainingOf(task);
            const canClaim = !task.is_completed && task.started && wait === 0;
            return (
              <EmbossCard key={task.id} className={`p-3.5 ${task.is_completed ? 'opacity-60' : ''}`} accent={!task.is_completed}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="emboss emboss-inset p-2.5 rounded-lg shrink-0">{getTaskIcon(task.type)}</div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-100">{task.title}</span>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">{task.description}</p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-1.5">
                        <Zap className="w-3 h-3" />
                        <span>+5 $DRILL</span>
                      </div>
                    </div>
                  </div>
                  {task.is_completed ? (
                    <button disabled className="emboss-btn shrink-0 px-3 py-2 text-[10px] font-bold bg-zinc-900 text-emerald-400">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> DONE</span>
                    </button>
                  ) : canClaim ? (
                    <button
                      type="button"
                      disabled={busyId === task.id}
                      onClick={() => claimTask(task)}
                      className="emboss-btn claim-cta shrink-0 px-3 py-2 text-[10px] font-bold"
                    >
                      {busyId === task.id ? 'CLAIMING' : 'CLAIM'}
                    </button>
                  ) : task.started ? (
                    <button disabled className="emboss-btn shrink-0 px-3 py-2 text-[10px] font-bold bg-zinc-900 text-amber-300">
                      {formatWait(wait)}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === task.id}
                      onClick={() => startTask(task)}
                      className="emboss-btn shrink-0 px-3 py-2 text-[10px] font-bold bg-emerald-500 text-black"
                    >
                      <span className="flex items-center gap-1">{task.link ? 'OPEN' : 'START'} <ExternalLink className="w-3 h-3" /></span>
                    </button>
                  )}
                </div>
              </EmbossCard>
            );
          })
        )}
      </section>
    </main>
  );
}
