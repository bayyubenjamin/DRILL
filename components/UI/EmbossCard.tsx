'use client';

import { useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function EmbossCard({
  children,
  className = '',
  accent = false,
  inset = false,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  inset?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const tilt = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = (clientX - box.left) / box.width - 0.5;
    const y = (clientY - box.top) / box.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${clientX - box.left}px`);
    el.style.setProperty('--my', `${clientY - box.top}px`);
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <motion.div
      ref={ref}
      className={`emboss ${accent ? 'emboss-accent' : ''} ${inset ? 'emboss-inset' : ''}`}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={{ scale: 0.978 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onPointerMove={(e) => tilt(e.clientX, e.clientY)}
      onPointerLeave={reset}
      onPointerDown={() => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light')}
    >
      <span className="emboss-ridge" />
      <span className="emboss-sheen" />
      <div className={`relative z-[1] ${className}`}>{children}</div>
    </motion.div>
  );
}
