'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

export default function LevelUpModal({
  open,
  level,
  title,
  onClose,
}: {
  open: boolean;
  level: number;
  title: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-emerald-400/50 bg-zinc-950 p-6 text-center shadow-[0_0_60px_rgba(16,185,129,0.35)]"
            initial={{ scale: 0.6, y: 40, rotate: -6 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            {[...Array(10)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-1 w-1 rounded-full bg-emerald-300"
                style={{ left: `${10 + (i * 8) % 80}%`, top: '18%' }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: [0, 70 + (i % 4) * 12], opacity: [1, 0] }}
                transition={{ duration: 1.1 + (i % 3) * 0.2, repeat: Infinity, delay: i * 0.08 }}
              />
            ))}

            <button type="button" onClick={onClose} className="absolute right-3 top-3 text-zinc-500">
              <X className="h-4 w-4" />
            </button>

            <motion.div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/10"
              animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Trophy className="h-7 w-7 text-amber-400" />
            </motion.div>

            <p className="text-[10px] font-mono tracking-[0.35em] text-emerald-400">LEVEL UP</p>
            <motion.p
              className="mt-1 font-mono text-6xl font-light text-white"
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            >
              {level}
            </motion.p>
            <p className="mt-1 text-xs font-mono tracking-[0.3em] text-amber-300">{title}</p>
            <p className="mt-3 text-[10px] font-mono text-zinc-500">Mining speed increased</p>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-mono font-bold tracking-widest text-black"
            >
              CONTINUE
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
