'use client';

import { useEffect, useState } from 'react';
import {
  isOpenedInsideTelegram,
  isTelegramScriptLoaded,
  TELEGRAM_MINIAPP_URL,
} from '@/lib/telegram/detect';
import DrillLanding from '@/components/UI/DrillLanding';

// How long to wait for Telegram to prove the page is inside the Mini App.
// telegram-web-app.js + initData arrive fast when they arrive at all —
// waiting 10s only made a regular browser stare at INITIALIZING...
// for 10 seconds before showing the button it needed. 2s is plenty,
// and the button below is clickable even while we are still checking.
const MAX_TRIES = 20;
const POLL_MS = 100;

export default function TelegramGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [insideTelegram, setInsideTelegram] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      if (cancelled) return false;
      if (isOpenedInsideTelegram()) {
        setInsideTelegram(true);
        setReady(true);
        try {
          window.Telegram?.WebApp?.ready?.();
          window.Telegram?.WebApp?.expand?.();
        } catch {
          // ignore
        }
        return true;
      }
      return false;
    };

    // Immediate check — a real Telegram open already has initData.
    if (check()) {
      return () => {
        cancelled = true;
      };
    }

    // Poll briefly: the script / initData can arrive a beat later on a
    // slow mobile connection. But once the script has loaded and there
    // is still no signed initData, this is a regular browser — stop
    // waiting and show the Open in Telegram screen instead of spinning.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (check()) {
        clearInterval(timer);
        return;
      }
      if (tries >= MAX_TRIES || (tries >= 5 && isTelegramScriptLoaded())) {
        clearInterval(timer);
        if (!cancelled) setReady(true);
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-black font-mono text-xs tracking-widest text-sky-400">
        <span className="spinner" aria-hidden />
        <span>INITIALIZING...</span>
        <a
          href={TELEGRAM_MINIAPP_URL}
          className="mt-2 text-[11px] tracking-widest text-zinc-400 underline underline-offset-4"
        >
          OPEN IN TELEGRAM →
        </a>
      </div>
    );
  }

  if (!insideTelegram) {
    // Regular browser: one clean informative page about DRILL, with
    // the Mini App CTA at the top (Bayu, 27 Nov 2026).
    return <DrillLanding />;
  }

  return <>{children}</>;
}
