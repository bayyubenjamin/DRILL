'use client';

import { motion } from 'framer-motion';

const BEAT = 0.86;
const impactEase = [0.22, 1, 0.36, 1] as const;

export default function MiningDrill({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center h-72 w-full overflow-hidden select-none">
      <motion.div
        className="absolute w-56 h-56 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.16), transparent 68%)' }}
        animate={active ? { scale: [1, 1.18, 1], opacity: [0.35, 0.7, 0.35] } : { scale: 1, opacity: 0.22 }}
        transition={{ duration: active ? 2.4 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {active && [0, 1, 2].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border border-emerald-400/20"
          style={{ width: 88 + ring * 36, height: 88 + ring * 36 }}
          animate={{ scale: [0.86, 1.18], opacity: [0.35, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: ring * 0.28, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        className="absolute bottom-[18%] w-40 h-10 rounded-[40%] bg-emerald-400/10 blur-md"
        animate={active ? { scaleX: [0.8, 1.15, 0.8], opacity: [0.2, 0.55, 0.2] } : { opacity: 0.12 }}
        transition={{ duration: BEAT, repeat: Infinity }}
      />

      <svg width="220" height="268" viewBox="0 0 220 268" className="relative z-10">
        <defs>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e4e4e7" />
            <stop offset="45%" stopColor="#71717a" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>
          <linearGradient id="housing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
          <radialGradient id="gem" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="35%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#064e3b" />
          </radialGradient>
          <filter id="softglow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.g
          animate={active ? { rotate: 360 } : { rotate: 0 }}
          style={{ originX: '110px', originY: '214px' }}
          transition={active ? { duration: 18, repeat: Infinity, ease: 'linear' } : { duration: 0.6 }}
        >
          <polygon points="110,188 146,206 146,230 110,248 74,230 74,206" fill="#111" stroke="#34d399" strokeOpacity="0.35" />
          <polygon points="110,196 136,210 136,226 110,238 84,226 84,210" fill="#0a0a0a" stroke="#34d399" strokeOpacity="0.2" />
        </motion.g>

        <motion.g
          filter={active ? 'url(#softglow)' : undefined}
          animate={active ? { scale: [1, 1.08, 0.96, 1.04, 1] } : { scale: [1, 1.03, 1] }}
          style={{ originX: '110px', originY: '214px' }}
          transition={{ duration: active ? BEAT : 3.2, repeat: Infinity, times: active ? [0, 0.48, 0.58, 0.72, 1] : [0, 0.5, 1] }}
        >
          <polygon points="110,198 132,212 110,236 88,212" fill="url(#gem)" />
          <polygon points="110,198 132,212 110,214" fill="#a7f3d0" opacity="0.45" />
        </motion.g>

        {active && Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const dx = Math.cos(angle) * (18 + (i % 3) * 10);
          const dy = Math.sin(angle) * (10 + (i % 4) * 6);
          return (
            <motion.circle
              key={i}
              cx={110}
              cy={214}
              r={i % 2 ? 1.4 : 0.9}
              fill={i % 3 === 0 ? '#fbbf24' : '#6ee7b7'}
              animate={{ x: [0, dx], y: [0, dy], opacity: [0, 1, 0], scale: [0.4, 1, 0.2] }}
              transition={{ duration: BEAT, repeat: Infinity, delay: 0.52, ease: 'easeOut' }}
            />
          );
        })}

        <motion.g
          animate={active ? { y: [0, 1, 16, 7, 0] } : { y: [0, 2, 0] }}
          transition={{
            duration: active ? BEAT : 3.4,
            repeat: Infinity,
            ease: active ? impactEase : 'easeInOut',
            times: active ? [0, 0.42, 0.56, 0.7, 1] : undefined,
          }}
        >
          <rect x="78" y="18" width="64" height="46" rx="8" fill="url(#housing)" stroke="#34d399" strokeOpacity={active ? 0.55 : 0.22} />
          <rect x="86" y="26" width="14" height="6" rx="1" fill={active ? '#34d399' : '#3f3f46'} />
          <rect x="120" y="26" width="14" height="6" rx="1" fill={active ? '#34d399' : '#3f3f46'} />
          <rect x="94" y="40" width="32" height="8" rx="2" fill="#09090b" />
          <rect x="96" y="62" width="28" height="16" fill="#18181b" stroke="#27272a" />

          <motion.g
            style={{ originX: '110px', originY: '128px' }}
            animate={active ? { rotate: 360 } : { rotate: 0 }}
            transition={active ? { duration: 0.42, repeat: Infinity, ease: 'linear' } : { duration: 0.4 }}
          >
            <path d="M110 78 C124 90 96 104 124 118 C96 132 124 146 110 160 C96 146 124 132 96 118 C124 104 96 90 110 78Z" fill="url(#steel)" />
            <rect x="106" y="80" width="8" height="80" rx="3" fill="#6ee7b7" opacity="0.8" />
          </motion.g>

          <path d="M102 160 L118 160 L110 196 Z" fill="url(#steel)" stroke="#34d399" strokeOpacity={active ? 0.7 : 0.18} />
        </motion.g>

        {active && (
          <motion.ellipse
            cx="110"
            cy="214"
            rx="26"
            ry="8"
            fill="#6ee7b7"
            animate={{ opacity: [0, 0, 0.55, 0], scale: [0.6, 0.6, 1.3, 1] }}
            transition={{ duration: BEAT, repeat: Infinity, times: [0, 0.5, 0.58, 1] }}
          />
        )}
      </svg>

      <motion.div
        className="absolute bottom-1 text-[9px] font-mono tracking-[0.35em]"
        animate={active ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.45 }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        <span className={active ? 'text-emerald-400' : 'text-zinc-500'}>{active ? 'CORE LOCKED' : 'STANDBY'}</span>
      </motion.div>
    </div>
  );
}
