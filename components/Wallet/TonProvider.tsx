'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';

export default function TonProvider({ children }: { children: React.ReactNode }) {
  // Ganti dengan URL origin aplikasi Anda (harus HTTPS)
  const manifestUrl = 'https://drill-chi-flax.vercel.app/tonconnect-manifest.json';
  
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
