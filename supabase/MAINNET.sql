-- Run once on the PRODUCTION Supabase project.

-- Tasks
alter table if exists public.tasks add column if not exists link text;
alter table if exists public.tasks add column if not exists slug text;
alter table if exists public.user_tasks add column if not exists started_at timestamptz default now();
alter table if exists public.user_tasks add column if not exists claimed_at timestamptz;

-- Referral pools
alter table public.mining_accounts add column if not exists valid_ref_pool numeric default 0;
alter table public.mining_accounts add column if not exists friend_pool numeric default 0;

-- Withdraw history
alter table public.withdrawals add column if not exists tx_hash text;
alter table public.withdrawals add column if not exists updated_at timestamptz default now();
