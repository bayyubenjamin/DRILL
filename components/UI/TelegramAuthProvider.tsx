'use client';

import { ReactNode } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserStore } from '@/store/useUserStore';
import TelegramGate from '@/components/UI/TelegramGate';

function AuthenticatedShell({ children }: { children: ReactNode }) {
  useTelegramAuth();
  const { isLoading } = useUserStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-black text-white">
        <span className="spinner" aria-hidden />
        <div className="text-sm font-mono tracking-widest text-emerald-500">
          INITIALIZING DRILL CORE...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function TelegramAuthProvider({ children }: { children: ReactNode }) {
  return (
    <TelegramGate>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </TelegramGate>
  );
}
