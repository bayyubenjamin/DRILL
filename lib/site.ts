// Single source of truth for the app's public URL.
//
// HISTORY: drillprotocol.xyz went NXDOMAIN in Nov 2026 because the
// registrant contact email was never verified — Vercel Domain Services
// kept suspending the domain (24 Oct, 8 Nov 2026) for the missed ICANN
// verification. The email was finally verified on 19 Nov 2026, the
// suspension banner cleared in the Vercel dashboard, and the domain is
// connected to the "drill" project (expires 10 Sep 2027). DNS was still
// NXDOMAIN right after verification, so propagation is pending — but
// drillprotocol.xyz is the canonical URL again from here on.
export const CANONICAL_URL = 'https://drillprotocol.xyz';

export const TONCONNECT_MANIFEST_URL = `${CANONICAL_URL}/tonconnect-manifest.json`;

/**
 * Resolve the TonConnect manifest URL. The Vercel env var
 * NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL wins — unless it still points at
 * the old drill-chi-flax.vercel.app fallback, in which case it is
 * rewritten to the canonical .xyz URL so wallet connect follows the
 * domain the user now wants.
 */
export function resolveTonConnectManifestUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL;
  if (fromEnv && fromEnv.length > 0) {
    if (fromEnv.includes('drill-chi-flax.vercel.app')) {
      return fromEnv.replace('https://drill-chi-flax.vercel.app', CANONICAL_URL);
    }
    return fromEnv;
  }
  return TONCONNECT_MANIFEST_URL;
}
