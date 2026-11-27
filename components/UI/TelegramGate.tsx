'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  isOpenedInsideTelegram,
  isTelegramScriptLoaded,
  TELEGRAM_BOT_URL,
  TELEGRAM_MINIAPP_DEEP_LINK,
  TELEGRAM_MINIAPP_URL,
} from '@/lib/telegram/detect';

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

  const openTelegram = () => {
    // Try the native app first, but only fall back to the t.me link if
    // the user is still on this page — the old 400ms unconditional
    // fallback yanked users back to the browser even after Telegram
    // had opened.
    window.location.href = TELEGRAM_MINIAPP_DEEP_LINK;
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.href = TELEGRAM_MINIAPP_URL;
      }
    }, 1200);
  };

  if (!ready) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-black font-mono text-xs tracking-widest text-emerald-500">
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
    return (
      <main className="min-h-screen max-w-md mx-auto px-5 py-10 flex flex-col items-center justify-center text-center text-white font-mono">
        <div className="emboss emboss-accent w-full p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/10">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
          </div>
          <p className="text-[10px] tracking-[0.3em] text-amber-400">ACCESS LOCKED</p>
          <h1 className="mt-2 text-lg tracking-widest text-white">OPEN IN TELEGRAM</h1>
          <p className="mt-3 text-[12px] leading-relaxed text-zinc-400">
            DRILL ENGINE only runs as a Telegram Mini App. A regular browser cannot be used for mining, wallet, or claims.
          </p>
          <a
            href={TELEGRAM_MINIAPP_URL}
            onClick={(e) => {
              e.preventDefault();
              openTelegram();
            }}
            className="emboss-btn mt-6 block w-full bg-emerald-500 py-3.5 text-xs font-bold text-black"
          >
            OPEN IN TELEGRAM
          </a>
          <a href={TELEGRAM_BOT_URL} className="mt-4 block text-[11px] tracking-widest text-zinc-500 underline underline-offset-4">
            t.me/drillengine_bot
          </a>
          <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">
            Opens the DRILL Mini App in Telegram — drillprotocol.xyz
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
