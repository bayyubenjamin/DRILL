'use client';

import { useEffect, useRef, useState } from 'react';
import { getLevelTitle } from '@/lib/level/ranks';

export function useLevelUpPopup(level: number, ready: boolean, walletAddress?: string) {
  const [popup, setPopup] = useState<{ to: number; title: string } | null>(null);
  const armed = useRef(false);

  const armAfterClaim = () => {
    armed.current = true;
  };

  useEffect(() => {
    if (!ready || !walletAddress || !level) return;
    const key = `drill:last-level:${walletAddress}`;
    const stored = Number(window.sessionStorage.getItem(key) || 0);

    if (!stored) {
      window.sessionStorage.setItem(key, String(level));
      armed.current = false;
      return;
    }

    if (armed.current && level > stored) {
      setPopup({ to: level, title: getLevelTitle(level) });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
      window.sessionStorage.setItem(key, String(level));
    } else if (level >= stored) {
      window.sessionStorage.setItem(key, String(level));
    }

    armed.current = false;
  }, [level, ready, walletAddress]);

  return { popup, closePopup: () => setPopup(null), armAfterClaim };
}
