import { createBrowserClient } from '@supabase/ssr';

// Browser (client-side) Supabase client. Previously this file was 0 bytes,
// so any future client-side Supabase import would silently resolve to
// nothing. Server/API code keeps using lib/supabase/server.ts
// (supabaseAdmin, service-role) — never use this client for admin writes.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createBrowserClient(url, anonKey);
}

// Lazily-created singleton for client components that need it.
let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) browserClient = createSupabaseBrowserClient();
  return browserClient;
}
