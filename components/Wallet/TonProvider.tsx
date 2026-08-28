'use client';

import React from 'react';
import { THEME, TonConnectUIProvider } from '@tonconnect/ui-react';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://drill-chi-flax.vercel.app';

const MANIFEST_URL =
  process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL ??
  `${APP_URL}/tonconnect-manifest.json`;

const TWA_RETURN_URL = process.env.NEXT_PUBLIC_TWA_RETURN_URL;

export default function TonProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl={MANIFEST_URL}
      restoreConnection
      uiPreferences={{
        theme: THEME.DARK,
        borderRadius: 's',
      }}
      actionsConfiguration={{
        returnStrategy: 'back',
        ...(TWA_RETURN_URL
          ? { twaReturnUrl: TWA_RETURN_URL as `${string}://${string}` }
          : {}),
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
