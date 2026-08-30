'use client';

import { motion } from 'framer-motion';

export default function DrillPassCard({ active, compact = false }: { active: boolean; compact?: boolean }) {
  return (
    <motion.div
      className={`emboss ${active ? 'emboss-accent' : ''} relative overflow-hidden ${compact ? 'h-16 w-16' : 'h-44 w-32'}`}
      whileTap={{ scale: 0.97, rotateX: 8 }}
      animate={active ? { y: [0, -2, 0] } : { y: 0 }}
      transition={{ duration: 2.4, repeat: Infinity }}
    >
      <img src="/drill-pass.svg" alt="DRILL Pass" className="h-full w-full object-cover" />
      {!active && <div className="absolute inset-0 bg-black/55" />}
    </motion.div>
  );
}
