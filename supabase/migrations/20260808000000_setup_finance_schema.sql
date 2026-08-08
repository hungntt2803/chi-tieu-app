-- Enable UUID Extension if not already active
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist to prevent schema conflicts
drop table if exists public.budgets cascade;
drop table if exists public.transactions cascade;
drop table if exists public.categories cascade;

-- 1. Create categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- Null indicates system default
  name text not null,
  icon text not null,
  color text not null,
  bar_color text not null,
  bg_color text not null,
  border_color text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz default now()
);

-- 2. Create transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  date text not null, -- Format YYYY-MM-DD
  notes text default '',
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz default now()
);

-- 3. Create budgets table
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade, -- Null means total monthly budget limit
  amount numeric not null check (amount >= 0),
  month text not null, -- Format YYYY-MM
  created_at timestamptz default now()
);

-- Unique indexes to prevent duplicate budgets
create unique index budgets_user_month_category_idx on public.budgets(user_id, month, category_id) where category_id is not null;
create unique index budgets_user_month_total_idx on public.budgets(user_id, month) where category_id is null;

-- 4. Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- 5. Define Security Policies
-- Categories Policies: Read default + user owned, write only user owned
create policy "Allow select for public and owned categories" 
  on public.categories for select 
  using (user_id is null or user_id = auth.uid());

create policy "Allow insert for user categories" 
  on public.categories for insert 
  with check (user_id = auth.uid());

create policy "Allow update for user categories" 
  on public.categories for update 
  using (user_id = auth.uid()) 
  with check (user_id = auth.uid());

create policy "Allow delete for user categories" 
  on public.categories for delete 
  using (user_id = auth.uid());

-- Transactions Policies: Owner operation only
create policy "Allow all operations for transaction owners" 
  on public.transactions for all 
  using (user_id = auth.uid()) 
  with check (user_id = auth.uid());

-- Budgets Policies: Owner operation only
create policy "Allow all operations for budget owners" 
  on public.budgets for all 
  using (user_id = auth.uid()) 
  with check (user_id = auth.uid());

-- 6. Seed default system categories (user_id is NULL)
insert into public.categories (name, icon, color, bar_color, bg_color, border_color, type) values
-- Expense categories
('Ăn uống', 'Utensils', 'text-orange-500 dark:text-orange-400', 'bg-orange-500', 'bg-orange-50 dark:bg-orange-950/30', 'border-orange-200 dark:border-orange-900/50', 'expense'),
('Di chuyển', 'Car', 'text-blue-500 dark:text-blue-400', 'bg-blue-500', 'bg-blue-50 dark:bg-blue-950/30', 'border-blue-200 dark:border-blue-900/50', 'expense'),
('Mua sắm', 'ShoppingBag', 'text-pink-500 dark:text-pink-400', 'bg-pink-500', 'bg-pink-50 dark:bg-pink-950/30', 'border-pink-200 dark:border-pink-900/50', 'expense'),
('Hoá đơn', 'Receipt', 'text-amber-500 dark:text-amber-400', 'bg-amber-500', 'bg-amber-50 dark:bg-amber-950/30', 'border-amber-200 dark:border-amber-900/50', 'expense'),
('Giáo dục', 'GraduationCap', 'text-indigo-500 dark:text-indigo-400', 'bg-indigo-500', 'bg-indigo-50 dark:bg-indigo-950/30', 'border-indigo-200 dark:border-indigo-900/50', 'expense'),
('Sức khỏe', 'HeartPulse', 'text-emerald-500 dark:text-emerald-400', 'bg-emerald-500', 'bg-emerald-50 dark:bg-emerald-950/30', 'border-emerald-200 dark:border-emerald-900/50', 'expense'),
('Giải trí', 'Gamepad2', 'text-purple-500 dark:text-purple-400', 'bg-purple-500', 'bg-purple-50 dark:bg-purple-950/30', 'border-purple-200 dark:border-purple-900/50', 'expense'),
('Khác', 'HelpCircle', 'text-slate-500 dark:text-slate-400', 'bg-slate-500', 'bg-slate-50 dark:bg-slate-900/30', 'border-slate-200 dark:border-slate-800/50', 'expense'),

-- Income categories
('Lương', 'Briefcase', 'text-emerald-600 dark:text-emerald-400', 'bg-emerald-600', 'bg-emerald-50 dark:bg-emerald-950/30', 'border-emerald-200 dark:border-emerald-900/50', 'income'),
('Thưởng', 'Award', 'text-yellow-500 dark:text-yellow-400', 'bg-yellow-500', 'bg-yellow-50 dark:bg-yellow-950/30', 'border-yellow-200 dark:border-yellow-900/50', 'income'),
('Đầu tư', 'TrendingUp', 'text-teal-500 dark:text-teal-400', 'bg-teal-500', 'bg-teal-50 dark:bg-teal-950/30', 'border-teal-200 dark:border-teal-900/50', 'income'),
('Thu nhập khác', 'Coins', 'text-cyan-500 dark:text-cyan-400', 'bg-cyan-500', 'bg-cyan-50 dark:bg-cyan-950/30', 'border-cyan-200 dark:border-cyan-900/50', 'income');
