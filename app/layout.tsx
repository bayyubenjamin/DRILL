import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/UI/BottomNav';
import ToastViewport from '@/components/UI/Toast';
import TonProvider from '@/components/Wallet/TonProvider';
import TelegramAuthProvider from '@/components/UI/TelegramAuthProvider';
import AppBackground from '@/components/UI/AppBackground';
import PageTransition from '@/components/UI/PageTransition';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Drill Engine',
  description: 'Mine $DRILL in Telegram. Mint the Drill Pass, level up and claim rewards.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050605',
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
            <div className="app-shell pb-20">
              <PageTransition>{children}</PageTransition>
            </div>
            <BottomNav />
            <ToastViewport />
          </TelegramAuthProvider>
        </TonProvider>
      </body>
    </html>
  );
}
