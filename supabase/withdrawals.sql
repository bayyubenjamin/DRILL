-- Optional extras for withdraw history.
alter table public.withdrawals add column if not exists tx_hash text;
alter table public.withdrawals add column if not exists updated_at timestamptz default now();
