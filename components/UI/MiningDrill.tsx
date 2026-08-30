'use client';

import { motion } from 'framer-motion';

export default function MiningDrill({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center h-64 w-full overflow-hidden">
      {active && (
        <>
          <motion.div
            className="absolute w-48 h-48 rounded-full border border-emerald-500/20"
            animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.08, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-32 h-32 rounded-full bg-emerald-500/10 blur-xl"
            animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute w-1 h-1 rounded-full bg-emerald-300"
              style={{ left: `${42 + i * 6}%`, top: '72%' }}
              animate={{ y: [0, 18 + i * 4], opacity: [0.9, 0], scale: [1, 0.4] }}
              transition={{ duration: 0.7 + i * 0.1, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </>
      )}

      <motion.div
        className="relative z-10"
        animate={active ? { y: [0, 6, 0] } : { y: 0 }}
        transition={active ? { duration: 0.18, repeat: Infinity } : { duration: 0.3 }}
      >
        <svg width="148" height="188" viewBox="0 0 148 188" fill="none">
          <defs>
            <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4d4d8" />
              <stop offset="50%" stopColor="#71717a" />
              <stop offset="100%" stopColor="#3f3f46" />
            </linearGradient>
            <linearGradient id="core" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="46" y="10" width="56" height="28" rx="6" fill="#18181b" stroke="#34d399" strokeOpacity="0.5" />
          <rect x="54" y="16" width="12" height="6" rx="1" fill={active ? '#34d399' : '#3f3f46'} />
          <rect x="82" y="16" width="12" height="6" rx="1" fill={active ? '#34d399' : '#3f3f46'} />
          <rect x="58" y="36" width="32" height="14" fill="#111" stroke="#27272a" />

          <g filter={active ? 'url(#glow)' : undefined}>
            <motion.g
              style={{ originX: '74px', originY: '96px' }}
              animate={active ? { rotate: 360 } : { rotate: 0 }}
              transition={active ? { duration: 0.55, repeat: Infinity, ease: 'linear' } : { duration: 0.4 }}
            >
              <path d="M74 52 C86 62 62 74 86 86 C62 98 86 110 74 122 C62 110 86 98 62 86 C86 74 62 62 74 52Z" fill="url(#steel)" />
              <path d="M70 54 L78 54 L78 128 L70 128 Z" fill="url(#core)" opacity="0.85" />
            </motion.g>
            <path d="M66 128 L82 128 L74 168 Z" fill="url(#steel)" stroke="#34d399" strokeOpacity={active ? 0.8 : 0.2} />
          </g>

          <ellipse cx="74" cy="176" rx="28" ry="6" fill="#000" opacity="0.45" />
        </svg>
      </motion.div>

      <div className="absolute bottom-2 text-[9px] font-mono tracking-[0.25em] text-zinc-500">
        {active ? 'DRILLING' : 'STANDBY'}
      </div>
    </div>
  );
}
