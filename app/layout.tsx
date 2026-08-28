import Script from 'next/script';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/UI/BottomNav'; // <-- Tambahkan import ini

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
        {/* Load script Telegram seawal mungkin */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
