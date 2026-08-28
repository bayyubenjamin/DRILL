'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pickaxe, CheckSquare, Hexagon, Users, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'MINE', path: '/', icon: Pickaxe },
    { name: 'TASKS', path: '/tasks', icon: CheckSquare },
    { name: 'DRILL', path: '/drill', icon: Hexagon, center: true },
    { name: 'FRIENDS', path: '/referral', icon: Users },
    { name: 'PROFILE', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black border-t border-zinc-900 pb-safe z-50">
      <div className="flex justify-around items-end h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          if (item.center) {
            return (
              <Link key={item.name} href={item.path} className="flex flex-col items-center justify-center w-full -mt-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                    isActive
                      ? 'bg-emerald-500 border-emerald-300 text-black shadow-[0_0_20px_rgba(16,185,129,0.45)]'
                      : 'bg-zinc-950 border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  <Icon size={22} />
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
              className={`flex flex-col items-center justify-center w-full h-16 gap-1 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <Icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : ''} />
              <span className="text-[9px] font-mono tracking-widest font-bold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
