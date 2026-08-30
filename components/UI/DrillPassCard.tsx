'use client';

import { motion } from 'framer-motion';

export default function DrillPassCard({ active, compact = false }: { active: boolean; compact?: boolean }) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border ${
        active ? 'border-emerald-400/70 shadow-[0_0_24px_rgba(16,185,129,0.25)]' : 'border-zinc-800'
      } ${compact ? 'h-16 w-16' : 'h-44 w-32'}`}
      animate={active ? { boxShadow: ['0 0 12px rgba(16,185,129,0.15)', '0 0 28px rgba(16,185,129,0.4)', '0 0 12px rgba(16,185,129,0.15)'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <img src="/drill-pass.svg" alt="DRILL Pass" className="h-full w-full object-cover" />
      {!active && <div className="absolute inset-0 bg-black/55" />}
    </motion.div>
  );
}
