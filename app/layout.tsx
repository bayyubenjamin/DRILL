import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/UI/BottomNav';

const TonProvider = dynamic(() => import('@/components/Wallet/TonProvider'), {
  ssr: false,
});

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
          <div className="pb-20">
            {children}
          </div>
          <BottomNav />
        </TonProvider>
      </body>
    </html>
  );
}
