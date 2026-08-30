'use client';

import { Globe } from 'lucide-react';
import { SOCIALS } from '@/lib/socials';

export default function SocialLinks() {
  const items = [
    { label: 'WEB', href: SOCIALS.website },
    { label: 'X', href: SOCIALS.x },
    { label: 'TG', href: SOCIALS.telegram },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="emboss h-12 flex flex-col items-center justify-center"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400 mb-1" />
          <span className="text-[9px] tracking-[0.22em] text-zinc-400">{item.label}</span>
        </a>
      ))}
    </div>
  );
}
