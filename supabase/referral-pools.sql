-- Run once in Supabase SQL editor.

alter table public.mining_accounts add column if not exists valid_ref_pool numeric default 0;
alter table public.mining_accounts add column if not exists friend_pool numeric default 0;
