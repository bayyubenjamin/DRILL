import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/UI/BottomNav';
import TonProvider from '@/components/Wallet/TonProvider';
import TelegramAuthProvider from '@/components/UI/TelegramAuthProvider';
import AppBackground from '@/components/UI/AppBackground';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Drill Engine',
  description: 'Drill Web3 App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>
        <TonProvider>
          <TelegramAuthProvider>
            <AppBackground />
            <div className="app-shell pb-20">{children}</div>
            <BottomNav />
          </TelegramAuthProvider>
        </TonProvider>
      </body>
    </html>
  );
}
