'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { create } from 'zustand';
import { notify } from '@/lib/telegram/haptic';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
  /** Optional action button label (e.g. "Try again"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Milidetik sebelum hilang sendiri; 0 = tidak hilang sendiri. */
  durationMs: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id' | 'durationMs'> & { durationMs?: number }) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    const item: ToastItem = {
      ...toast,
      id,
      durationMs: toast.durationMs ?? (toast.kind === 'error' ? 9000 : 5000),
    };
    set((s) => ({ toasts: [...s.toasts.slice(-2), item] }));
    notify(item.kind === 'error' ? 'error' : item.kind === 'success' ? 'success' : 'warning');
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Show a toast. Used from anywhere, e.g. when a wallet fails to bind. */
export function showToast(toast: Omit<ToastItem, 'id' | 'durationMs'> & { durationMs?: number }): number {
  return useToastStore.getState().push(toast);
}

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />,
  error: <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />,
  info: <Info className="w-4 h-4 shrink-0 text-sky-400" />,
} as const;

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    if (toast.durationMs <= 0) return;
    const t = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(t);
  }, [toast.durationMs, toast.id, dismiss]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto w-full rounded-xl border border-zinc-800 bg-zinc-950/95 px-3 py-2.5 shadow-2xl shadow-black/60 backdrop-blur"
    >
      <div className="flex items-start gap-2.5">
        {ICONS[toast.kind]}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold tracking-wider text-white">{toast.title}</p>
          <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-zinc-400">{toast.message}</p>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                dismiss(toast.id);
                toast.onAction?.();
              }}
              className="mt-1.5 font-mono text-[11px] font-bold tracking-widest text-emerald-400 underline underline-offset-2"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => dismiss(toast.id)}
          className="shrink-0 p-0.5 text-zinc-500"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/** Dipasang sekali di layout; semua toast muncul di atas konten. */
export default function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[2147483647] flex flex-col items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
