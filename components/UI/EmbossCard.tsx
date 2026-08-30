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
    el.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
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
      className={`emboss ${accent ? 'emboss-accent' : ''} ${inset ? 'emboss-inset' : ''} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      onPointerMove={(e) => tilt(e.clientX, e.clientY)}
      onPointerLeave={reset}
    >
      <span className="emboss-sheen" />
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
