-- ============================================================================
-- DRILL — Full production schema (migration 0001)
-- ============================================================================
-- Run this file ONCE on a FRESH Supabase project (SQL Editor).
-- It is idempotent: safe to re-run on the existing test project too.
-- Reconstructed 19 Nov 2026 from: repo code (all API routes), the SQL
-- files in supabase/, and the live DRILL ENGINE project inspection.
-- Anything the code reads/writes is defined here; nothing is assumed
-- to exist from manual dashboard work anymore.
--
-- Frozen economics v1.0 (19 Nov 2026) additions:
--   * emission_quarters — global quarterly emission budget counter
--     (Q1 100M, halving every 90 days, total 200M). The claim path
--     increments `minted` atomically; when minted >= budget, mining
--     pauses until the next quarter.
--   * app_config — genesis timestamp + spec version. genesis is set
--     at Jetton mainnet deploy time (00:00 UTC), NOT Sep 2024.
--
-- Security model: every table has RLS ENABLED with NO policies for
-- anon/authenticated. All access goes through the service-role key
-- from server-side API routes only (lib/supabase/server.ts). The
-- browser client is never used to touch tables (verified: no
-- component imports it). RLS here is the second layer: even if the
-- anon key leaks, PostgREST returns nothing.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null,
  username text,
  first_name text,
  last_name text,
  wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'users_telegram_user_id_unique') then
    alter table public.users add constraint users_telegram_user_id_unique unique (telegram_user_id);
  end if;
end $$;

create unique index if not exists users_wallet_address_unique
  on public.users (wallet_address)
  where wallet_address is not null;

create index if not exists users_created_at_idx on public.users (created_at);

-- ---------------------------------------------------------------------------
-- mining_accounts (one per user)
-- ---------------------------------------------------------------------------
create table if not exists public.mining_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  balance numeric not null default 0,
  mining_speed numeric not null default 0,
  level integer not null default 1,
  mining_active boolean not null default false,
  last_claim_at timestamptz,
  valid_ref_pool numeric not null default 0,
  friend_pool numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'mining_accounts_user_id_unique') then
    alter table public.mining_accounts add constraint mining_accounts_user_id_unique unique (user_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'mining_accounts_user_id_fkey') then
    alter table public.mining_accounts add constraint mining_accounts_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- mining_claims (append-only claim ledger)
-- ---------------------------------------------------------------------------
create table if not exists public.mining_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'mining_claims_user_id_fkey') then
    alter table public.mining_claims add constraint mining_claims_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
end $$;

create index if not exists mining_claims_user_created_idx
  on public.mining_claims (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- mining_nfts (bound Drill Pass SBT, one row per wallet)
-- ---------------------------------------------------------------------------
create table if not exists public.mining_nfts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nft_address text not null,
  collection_address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'mining_nfts_nft_address_unique') then
    alter table public.mining_nfts add constraint mining_nfts_nft_address_unique unique (nft_address);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'mining_nfts_user_id_fkey') then
    alter table public.mining_nfts add constraint mining_nfts_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
end $$;

create index if not exists mining_nfts_user_idx on public.mining_nfts (user_id);

-- ---------------------------------------------------------------------------
-- referrals
-- status: pending -> valid (valid = referred user holds a Pass on-chain,
-- made a first mining claim, and is 7+ days old — Frozen v1.0 §1/§4)
-- ---------------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  referred_id uuid not null,
  reward numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'referrals_referred_id_unique') then
    alter table public.referrals add constraint referrals_referred_id_unique unique (referred_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'referrals_referrer_id_fkey') then
    alter table public.referrals add constraint referrals_referrer_id_fkey
      foreign key (referrer_id) references public.users (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'referrals_referred_id_fkey') then
    alter table public.referrals add constraint referrals_referred_id_fkey
      foreign key (referred_id) references public.users (id) on delete cascade;
  end if;
end $$;

create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

-- ---------------------------------------------------------------------------
-- tasks + user_tasks (from supabase/tasks.sql, consolidated)
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text,
  reward numeric not null default 5,
  type text not null default 'social',
  link text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  task_id uuid not null,
  status text not null default 'started',
  started_at timestamptz default now(),
  claimed_at timestamptz,
  unique (user_id, task_id)
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_tasks_user_id_fkey') then
    alter table public.user_tasks add constraint user_tasks_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_tasks_task_id_fkey') then
    alter table public.user_tasks add constraint user_tasks_task_id_fkey
      foreign key (task_id) references public.tasks (id) on delete cascade;
  end if;
end $$;

-- Duplicate-index cleanup (Supabase Performance Advisor, 19 Nov 2026):
-- the unique (user_id, task_id) constraint already creates its own index,
-- so the standalone user_tasks_user_task_unique index is redundant.
drop index if exists public.user_tasks_user_task_unique;

alter table public.tasks add column if not exists slug text;
alter table public.tasks add column if not exists link text;
alter table public.tasks add column if not exists type text default 'social';
alter table public.tasks add column if not exists reward numeric default 5;
alter table public.tasks add column if not exists is_active boolean default true;
alter table public.tasks add column if not exists created_at timestamptz default now();
alter table public.user_tasks add column if not exists status text default 'started';
alter table public.user_tasks add column if not exists started_at timestamptz default now();
alter table public.user_tasks add column if not exists claimed_at timestamptz;

create unique index if not exists tasks_slug_unique on public.tasks (slug);

update public.tasks set reward = 5;
update public.tasks set is_active = true where is_active is null;

-- Seed tasks. NOTE: the tg-channel / twitter-follow links point at
-- t.me/drillprotocol and x.com/drillprotocol — those handles are the
-- app's own references; confirm the accounts exist before mainnet
-- (see Fase 0 report, 19 Nov 2026).
insert into public.tasks (slug, title, description, reward, type, link, is_active)
values
  ('daily-login', 'Daily Drill Login', 'Open the engine every day to keep your generator online.', 5, 'daily', null, true),
  ('tg-channel', 'Join Drill Telegram Official', 'Join the official Telegram channel for updates.', 5, 'social', 'https://t.me/drillprotocol', true),
  ('twitter-follow', 'Follow DRILL on X', 'Follow the official X account.', 5, 'social', 'https://x.com/drillprotocol', true),
  ('wallet-connect', 'Connect TON Testnet Wallet', 'Connect a TON Testnet wallet to bind your account.', 5, 'onchain', null, true),
  ('mint-pass', 'Mint Mining NFT Pass', 'Mint the Drill Pass SBT to unlock mining.', 5, 'onchain', null, true)
on conflict (slug) do update
set reward = 5,
    title = excluded.title,
    description = excluded.description,
    type = excluded.type,
    link = excluded.link,
    is_active = true;

-- ---------------------------------------------------------------------------
-- withdrawals
-- status lifecycle (Fase 1 executor): QUEUED -> PROCESSING -> SENT | FAILED
-- FAILED must refund the balance (executor responsibility).
-- ---------------------------------------------------------------------------
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  wallet_address text not null,
  amount numeric not null,
  fee numeric not null default 70,
  receive_amount numeric not null,
  status text not null default 'QUEUED',
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'withdrawals_user_id_fkey') then
    alter table public.withdrawals add constraint withdrawals_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
end $$;

create index if not exists withdrawals_user_created_idx
  on public.withdrawals (user_id, created_at desc);
create index if not exists withdrawals_status_idx
  on public.withdrawals (status, created_at);

alter table public.withdrawals add column if not exists tx_hash text;
alter table public.withdrawals add column if not exists updated_at timestamptz default now();

-- ---------------------------------------------------------------------------
-- emission_quarters — Frozen v1.0 §3 (new)
-- One row per 90-day quarter starting at genesis. `budget` is the hard
-- cap for that quarter; `minted` is the running total of mining claims
-- credited in that quarter. The claim path must increment `minted`
-- atomically and refuse when minted >= budget.
-- ---------------------------------------------------------------------------
create table if not exists public.emission_quarters (
  quarter_start timestamptz primary key,
  budget numeric not null,
  minted numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- app_config — Frozen v1.0 (new)
-- genesis_timestamp is set at Jetton mainnet deploy (00:00 UTC).
-- It stays NULL until then on purpose: no mining quarter may start
-- before mainnet exists.
-- ---------------------------------------------------------------------------
create table if not exists public.app_config (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value) values
  ('economy_spec_version', '1.0'),
  ('genesis_timestamp', null)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security: ON everywhere, NO policies for anon/authenticated.
-- Only the service-role key (server-side API routes) can touch data.
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.mining_accounts enable row level security;
alter table public.mining_claims enable row level security;
alter table public.mining_nfts enable row level security;
alter table public.referrals enable row level security;
alter table public.tasks enable row level security;
alter table public.user_tasks enable row level security;
alter table public.withdrawals enable row level security;
alter table public.emission_quarters enable row level security;
alter table public.app_config enable row level security;

-- ---------------------------------------------------------------------------
-- Verify (run after applying, paste the output into the Fase 0 record):
--   select table_name from information_schema.tables
--     where table_schema = 'public' order by 1;
--   select key, value from public.app_config;
-- ---------------------------------------------------------------------------
