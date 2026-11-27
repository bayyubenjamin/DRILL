'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';
import AppIcon, { type AppIconName } from '@/components/UI/AppIcon';
import { impact } from '@/lib/telegram/haptic';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems: { name: string; path: string; icon: AppIconName; center?: boolean }[] = [
    { name: 'MINE', path: '/', icon: 'mine' },
    { name: 'TASKS', path: '/tasks', icon: 'tasks' },
    { name: 'DRILL', path: '/drill', icon: 'drill', center: true },
    { name: 'FRIENDS', path: '/referral', icon: 'friends' },
    { name: 'PROFILE', path: '/profile', icon: 'profile' },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black/82 backdrop-blur-md border-t border-emerald-500/15 pb-safe z-50"
    >
      <div className="flex justify-around items-end h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path;

          // Center button keeps the lucide mark: the generated icon is
          // blue art on black, which is invisible on the bright blue
          // circle. The other four tabs use the generated icon set.
          if (item.center) {
            return (
              <Link
                key={item.name}
                href={item.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => impact('light')}
                className="flex flex-col items-center justify-center w-full -mt-4 active:scale-90 transition-transform"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border transition-shadow ${
                    isActive
                      ? 'bg-emerald-500 border-emerald-300 text-black'
                      : 'bg-zinc-950 border-emerald-500/45 text-emerald-400'
                  }`}
                >
                  <Hexagon size={22} />
                </div>
                <span className={`text-[9px] font-mono tracking-widest font-bold mt-1 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => impact('light')}
              className={`relative flex flex-col items-center justify-center w-full h-16 gap-1 transition-colors active:scale-95 ${
                isActive ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-2 top-1 bottom-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <AppIcon name={item.icon} size={20} className={`relative z-[1] ${isActive ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]' : ''}`} />
              <span className="relative z-[1] text-[9px] font-mono tracking-widest font-bold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
