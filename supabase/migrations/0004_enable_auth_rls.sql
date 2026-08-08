-- =============================================================================
-- Migration 0004: Multi-user Auth + Row Level Security
-- Mỗi người dùng chỉ thấy/sửa dữ liệu của chính mình.
-- Danh mục mặc định (is_default = true, user_id IS NULL) dùng chung cho mọi user.
-- =============================================================================

-- FK tới auth.users (an toàn nếu cột đã tồn tại)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_user_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
exception when others then
  raise notice 'transactions FK skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'categories_user_id_fkey'
  ) then
    alter table public.categories
      add constraint categories_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
exception when others then
  raise notice 'categories FK skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'budgets_user_id_fkey'
  ) then
    alter table public.budgets
      add constraint budgets_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
exception when others then
  raise notice 'budgets FK skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recurring_transactions_user_id_fkey'
  ) then
    alter table public.recurring_transactions
      add constraint recurring_transactions_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
exception when others then
  raise notice 'recurring FK skipped: %', sqlerrm;
end $$;

-- Bật RLS
alter table public.transactions enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;

-- Xóa policy cũ nếu chạy lại
drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;

drop policy if exists "categories_select" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;

drop policy if exists "budgets_select_own" on public.budgets;
drop policy if exists "budgets_insert_own" on public.budgets;
drop policy if exists "budgets_update_own" on public.budgets;
drop policy if exists "budgets_delete_own" on public.budgets;

drop policy if exists "recurring_select_own" on public.recurring_transactions;
drop policy if exists "recurring_insert_own" on public.recurring_transactions;
drop policy if exists "recurring_update_own" on public.recurring_transactions;
drop policy if exists "recurring_delete_own" on public.recurring_transactions;

-- TRANSACTIONS: chỉ dữ liệu của mình
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- CATEGORIES: mặc định chung + danh mục riêng của user
create policy "categories_select" on public.categories
  for select using (user_id is null or auth.uid() = user_id);
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id and coalesce(is_default, false) = false);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id and coalesce(is_default, false) = false);

-- BUDGETS
create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);

-- RECURRING
create policy "recurring_select_own" on public.recurring_transactions
  for select using (auth.uid() = user_id);
create policy "recurring_insert_own" on public.recurring_transactions
  for insert with check (auth.uid() = user_id);
create policy "recurring_update_own" on public.recurring_transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recurring_delete_own" on public.recurring_transactions
  for delete using (auth.uid() = user_id);
