import { CANONICAL_URL } from '@/lib/site';

// A stale Vercel env var still pointing at the old drill-chi-flax
// fallback is rewritten to the canonical .xyz URL, same as the
// TonConnect manifest in lib/site.ts.
const websiteFromEnv = process.env.NEXT_PUBLIC_WEBSITE_URL;
const website =
  websiteFromEnv && websiteFromEnv.includes('drill-chi-flax.vercel.app')
    ? CANONICAL_URL
    : websiteFromEnv || CANONICAL_URL;

export const SOCIALS = {
  website,
  x: process.env.NEXT_PUBLIC_X_URL || 'https://x.com/drillprotocol',
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/drillprotocol',
};
