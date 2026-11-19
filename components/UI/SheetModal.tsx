'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * Shared animated bottom-sheet modal for the Mini App.
 * - Spring enter/exit (fade-only when the user prefers reduced motion)
 * - Escape closes, backdrop click closes
 * - Rendered in a portal so it always sits above page content
 */
export default function SheetModal({
  open,
  onClose,
  children,
  zIndex = 9999,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Wallet picker needs to sit above the TonConnect widget root. */
  zIndex?: number;
  label: string;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-end justify-center p-4 sm:items-center"
          style={{ zIndex, background: 'rgba(0,0,0,0.78)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="emboss w-full max-w-sm p-4"
            initial={reduce ? { opacity: 0 } : { y: 28, opacity: 0, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 18, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
