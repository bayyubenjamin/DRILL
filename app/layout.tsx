import './globals.css';
import TelegramAuthProvider from '@/components/UI/TelegramAuthProvider';

export const metadata = {
  title: 'DRILL ENGINE',
  description: 'Genesis Season - Drill Network',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <TelegramAuthProvider>
          {children}
        </TelegramAuthProvider>
      </body>
    </html>
  );
}
