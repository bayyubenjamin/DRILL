'use client';

import { ReactNode } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserStore } from '@/store/useUserStore';

export default function TelegramAuthProvider({ children }: { children: ReactNode }) {
  useTelegramAuth();
  
  const { isLoading, isAuthenticated, isAuthFailed } = useUserStore();

  // Tampilkan loading selama proses auth berjalan
  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white">
        <div className="animate-pulse text-sm font-mono tracking-widest text-emerald-500">
          INITIALIZING DRILL CORE...
        </div>
      </div>
    );
  }

  // Hanya tampilkan Access Denied JIKA proses auth benar-benar sudah gagal/selesai 
  // dan statusnya bukan development mode
  if (isAuthFailed && process.env.NODE_ENV !== 'development') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-red-500 font-mono text-sm px-4 text-center">
        ERROR: ACCESS DENIED. PLEASE OPEN INSIDE TELEGRAM.
      </div>
    );
  }

  return <>{children}</>;
}
