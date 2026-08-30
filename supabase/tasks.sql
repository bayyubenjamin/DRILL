-- Run once in Supabase SQL editor.

alter table if exists public.tasks add column if not exists link text;
alter table if exists public.tasks add column if not exists slug text;
update public.tasks set reward = 5 where reward is distinct from 5;

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

alter table public.user_tasks add column if not exists started_at timestamptz default now();
alter table public.user_tasks add column if not exists claimed_at timestamptz;
alter table public.user_tasks add column if not exists status text default 'started';

insert into public.tasks (slug, title, description, reward, type, link, is_active)
values
  ('daily-login', 'Daily Drill Login', 'Open the engine every day to keep your generator online.', 5, 'daily', null, true),
  ('tg-channel', 'Join Drill Telegram Official', 'Join the official Telegram channel for updates.', 5, 'social', 'https://t.me/drillnetwork', true),
  ('twitter-follow', 'Follow DRILL on X', 'Follow the official X account.', 5, 'social', 'https://x.com', true),
  ('wallet-connect', 'Connect TON Testnet Wallet', 'Connect a TON Testnet wallet to bind your account.', 5, 'onchain', null, true),
  ('mint-pass', 'Mint Mining NFT Pass', 'Mint the Drill Pass SBT to unlock mining.', 5, 'onchain', null, true)
on conflict (slug) do update
set reward = 5,
    title = excluded.title,
    description = excluded.description,
    type = excluded.type,
    link = excluded.link,
    is_active = true;
