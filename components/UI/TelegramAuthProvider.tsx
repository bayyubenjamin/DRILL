'use client';

import { ReactNode } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserStore } from '@/store/useUserStore';

export default function TelegramAuthProvider({ children }: { children: ReactNode }) {
  useTelegramAuth();
  const { isLoading } = useUserStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white">
        <div className="animate-pulse text-sm font-mono tracking-widest text-emerald-500">
          INITIALIZING DRILL CORE...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
