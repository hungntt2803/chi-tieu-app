-- =============================================================================
-- Migration 0003: Giao dịch định kỳ (recurring)
-- =============================================================================

create table if not exists public.recurring_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,
  type          text not null default 'expense' check (type in ('income', 'expense')),
  amount        numeric(14, 2) not null check (amount > 0),
  category      text not null,
  notes         text default '',
  frequency     text not null default 'monthly' check (frequency in ('daily', 'weekly', 'monthly')),
  day_of_month  integer check (day_of_month is null or (day_of_month >= 1 and day_of_month <= 28)),
  next_run_date date not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_recurring_next_run
  on public.recurring_transactions (next_run_date)
  where active = true;
