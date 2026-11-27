'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
  const raf = useRef(0);
  const reduce = useReducedMotion();

  // 3D tilt only makes sense with a precise pointer (mouse/trackpad).
  // On touch devices pointermove fires while scrolling, so skip it there.
  // Updates are throttled through requestAnimationFrame.
  const tilt = (clientX: number, clientY: number) => {
    if (reduce) return;
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const x = (clientX - box.left) / box.width - 0.5;
      const y = (clientY - box.top) / box.height - 0.5;
      el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${clientX - box.left}px`);
      el.style.setProperty('--my', `${clientY - box.top}px`);
    });
  };

  const reset = () => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <motion.div
      ref={ref}
      className={`emboss w-full ${accent ? 'emboss-accent emboss-pulse' : ''} ${inset ? 'emboss-inset' : ''}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      onPointerMove={(e) => tilt(e.clientX, e.clientY)}
      onPointerLeave={reset}
      onPointerDown={() => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light')}
    >
      <span className="emboss-ridge" />
      <div className={`relative z-[1] w-full ${className}`}>{children}</div>
    </motion.div>
  );
}
