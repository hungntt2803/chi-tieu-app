-- =============================================================================
-- Migration 0001: Finance schema (transactions + categories + budgets)
-- App: Chi Tiêu App
-- Ghi chú: Migration này an toàn để chạy lại (idempotent) trên Supabase.
--          user_id để nullable, sẵn sàng bật Supabase Auth + RLS sau này.
-- =============================================================================

-- Bật extension tạo UUID nếu chưa có
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Bảng transactions
--    - Nếu bảng đã tồn tại (bản cũ chỉ có chi tiêu), migration sẽ chỉ thêm cột.
-- -----------------------------------------------------------------------------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  amount      numeric(14, 2) not null check (amount > 0),
  category    text not null,
  date        date not null,
  notes       text default '',
  created_at  timestamptz not null default now()
);

-- Thêm cột type ('income' | 'expense') cho bản DB cũ chỉ có chi tiêu
alter table public.transactions
  add column if not exists type text not null default 'expense';

alter table public.transactions
  add column if not exists user_id uuid;

-- Ràng buộc giá trị hợp lệ cho type
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_type_check'
  ) then
    alter table public.transactions
      add constraint transactions_type_check check (type in ('income', 'expense'));
  end if;
end $$;

create index if not exists idx_transactions_date on public.transactions (date);
create index if not exists idx_transactions_type on public.transactions (type);
create index if not exists idx_transactions_user on public.transactions (user_id);

-- -----------------------------------------------------------------------------
-- 2. Bảng categories (danh mục tùy chỉnh)
--    - icon: tên icon lucide-react (vd: 'Utensils', 'Car'...)
--    - color: khóa màu trong bảng màu app (vd: 'orange', 'blue'...)
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  name        text not null,
  icon        text not null default 'HelpCircle',
  color       text not null default 'slate',
  type        text not null default 'expense' check (type in ('income', 'expense')),
  is_default  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Tên danh mục là duy nhất theo (user_id, type). Với dữ liệu chung (user_id null)
-- ta dùng unique index có coalesce để tránh trùng.
create unique index if not exists uniq_categories_name
  on public.categories (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), type, name);

-- -----------------------------------------------------------------------------
-- 3. Bảng budgets (hạn mức theo tháng, tổng thể hoặc theo danh mục)
--    - month: 'YYYY-MM'
--    - category: NULL = hạn mức tổng của tháng; ngược lại là hạn mức của danh mục
-- -----------------------------------------------------------------------------
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  month       text not null,
  category    text,
  amount      numeric(14, 2) not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Mỗi (user, tháng, danh mục) chỉ có 1 hạn mức. category null xử lý bằng coalesce.
create unique index if not exists uniq_budgets_scope
  on public.budgets (
    coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    month,
    coalesce(category, '__ALL__')
  );

create index if not exists idx_budgets_month on public.budgets (month);
