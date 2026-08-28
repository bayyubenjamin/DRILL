'use client';

import { useEffect } from 'react';
import { THEME, TonConnectUIProvider } from '@tonconnect/ui-react';

const MANIFEST_URL =
  process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL ??
  'https://drill-chi-flax.vercel.app/tonconnect-manifest.json';

const TWA_RETURN_URL = process.env.NEXT_PUBLIC_TWA_RETURN_URL;

type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
};

function initTelegramWebApp() {
  if (typeof window === 'undefined') return;
  const tg = (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  if (!tg) return;
  try {
    tg.ready?.();
    tg.expand?.();
    tg.disableVerticalSwipes?.();
  } catch (error) {
    console.warn('Telegram WebApp init failed:', error);
  }
}

export default function TonProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTelegramWebApp();
  }, []);

  return (
    <TonConnectUIProvider
      manifestUrl={MANIFEST_URL}
      restoreConnection
      enableAndroidBackHandler={false}
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
