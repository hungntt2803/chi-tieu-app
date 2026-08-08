-- =============================================================================
-- Migration 0002: Seed danh mục mặc định
-- Chạy sau 0001. Idempotent nhờ ON CONFLICT với unique index uniq_categories_name.
-- =============================================================================

insert into public.categories (name, icon, color, type, is_default, sort_order)
values
  -- Chi tiêu
  ('Ăn uống',   'Utensils',    'orange', 'expense', true, 1),
  ('Di chuyển', 'Car',         'blue',   'expense', true, 2),
  ('Mua sắm',   'ShoppingBag', 'pink',   'expense', true, 3),
  ('Hoá đơn',   'Receipt',     'amber',  'expense', true, 4),
  ('Giải trí',  'Gamepad2',    'violet', 'expense', true, 5),
  ('Sức khỏe',  'HeartPulse',  'rose',   'expense', true, 6),
  ('Giáo dục',  'GraduationCap','cyan',  'expense', true, 7),
  ('Khác',      'HelpCircle',  'slate',  'expense', true, 99),
  -- Thu nhập
  ('Lương',        'Wallet',      'emerald', 'income', true, 1),
  ('Thưởng',       'Gift',        'green',   'income', true, 2),
  ('Đầu tư',       'TrendingUp',  'teal',    'income', true, 3),
  ('Thu nhập khác','CircleDollarSign','lime','income', true, 99)
on conflict (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), type, name)
do nothing;
