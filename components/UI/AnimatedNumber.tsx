'use client';

import { useEffect, useRef } from 'react';
import { useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { formatDrill } from '@/lib/format';

/**
 * Balance / reward readout that eases toward the new value instead of
 * snapping or remounting every tick. The animated text is written
 * straight to the DOM (no React re-render per frame). When the user
 * prefers reduced motion it renders the plain formatted value.
 */
export default function AnimatedNumber({
  value,
  digits = 4,
  className,
  prefix = '',
}: {
  value: number;
  digits?: number;
  className?: string;
  prefix?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(value, { stiffness: 140, damping: 22 });
  const text = useTransform(spring, (v) => `${prefix}${formatDrill(v, digits)}`);

  useMotionValueEvent(text, 'change', (v) => {
    if (ref.current) ref.current.textContent = v;
  });

  useEffect(() => {
    if (reduce) {
      spring.jump(value);
    } else {
      spring.set(value);
    }
  }, [value, spring, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatDrill(value, digits)}
    </span>
  );
}
