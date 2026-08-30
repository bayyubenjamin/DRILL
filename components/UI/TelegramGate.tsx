'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { isOpenedInsideTelegram, TELEGRAM_MINIAPP_DEEP_LINK, TELEGRAM_MINIAPP_URL } from '@/lib/telegram/detect';

export default function TelegramGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [insideTelegram, setInsideTelegram] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      if (cancelled) return;
      if (isOpenedInsideTelegram()) {
        setInsideTelegram(true);
        setReady(true);
        window.Telegram?.WebApp?.ready?.();
        window.Telegram?.WebApp?.expand?.();
        return true;
      }
      return false;
    };

    if (check()) return () => {
      cancelled = true;
    };

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (check() || tries >= 20) {
        clearInterval(timer);
        if (!cancelled) setReady(true);
      }
    }, 150);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const openTelegram = () => {
    window.location.href = TELEGRAM_MINIAPP_DEEP_LINK;
    setTimeout(() => {
      window.location.href = TELEGRAM_MINIAPP_URL;
    }, 400);
  };

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-emerald-500 font-mono text-xs tracking-widest">
        INITIALIZING...
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
            DRILL ENGINE hanya berjalan sebagai Telegram Mini App. Browser biasa tidak bisa dipakai untuk mining, wallet, atau claim.
          </p>
          <button type="button" onClick={openTelegram} className="emboss-btn mt-6 w-full bg-emerald-500 py-3.5 text-xs font-bold text-black">
            BUKA DI TELEGRAM
          </button>
          <p className="mt-3 text-[10px] text-zinc-600">t.me/drillengine_bot</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
