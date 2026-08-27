'use client';

import { ReactNode } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserStore } from '@/store/useUserStore';

export default function TelegramAuthProvider({ children }: { children: ReactNode }) {
  useTelegramAuth();
  
  const { isLoading, isAuthenticated } = useUserStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white">
        {/* Teks industrial/futuristik sesuai tema DRILL ENGINE */}
        <div className="animate-pulse text-sm font-mono tracking-widest text-emerald-500">
          INITIALIZING DRILL CORE...
        </div>
      </div>
    );
  }

  if (!isAuthenticated && process.env.NODE_ENV !== 'development') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-red-500 font-mono text-sm">
        ERROR: ACCESS DENIED. PLEASE OPEN INSIDE TELEGRAM.
      </div>
    );
  }

  return <>{children}</>;
}
