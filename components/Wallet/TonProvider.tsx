'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';

export default function TonProvider({ children }: { children: React.ReactNode }) {
  // Gunakan URL manifest absolut dari Vercel Anda
  const manifestUrl = 'https://drill-chi-flax.vercel.app/tonconnect-manifest.json';

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        // Memastikan modal koneksi dompet terbuka dengan baik di dalam ekosistem Telegram
        twaReturnUrl: 'https://t.me/DrillEngineBot/app' 
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
