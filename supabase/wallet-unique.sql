-- Run this once in Supabase SQL editor.
-- Enforces one wallet string per Telegram user going forward.

create unique index if not exists users_wallet_address_unique
  on public.users (wallet_address)
  where wallet_address is not null;
