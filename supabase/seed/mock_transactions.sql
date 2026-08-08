-- =============================================================================
-- MOCK DATA: Giao dịch mẫu cho Chi Tiêu App
-- Mục đích: có sẵn dữ liệu để xem dashboard, biểu đồ 6 tháng, hạn mức.
-- Cách chạy: chạy SAU migration 0001 + 0002.
--            An toàn chạy lại: đầu file xóa mọi mock cũ (đánh dấu bằng '[mock]').
-- Ngày dùng tương đối theo current_date để luôn "mới".
-- =============================================================================

-- Dọn dữ liệu mock cũ (chỉ xóa các dòng có ghi chú đánh dấu [mock])
delete from public.transactions where notes like '[mock]%';
delete from public.budgets where category is null and month in (
  to_char(current_date, 'YYYY-MM'),
  to_char(current_date - interval '1 month', 'YYYY-MM')
) and amount in (12000000, 11000000);

-- --------------------------- HẠN MỨC (BUDGETS) -------------------------------
insert into public.budgets (month, category, amount)
values
  (to_char(current_date, 'YYYY-MM'),                       null,        12000000),
  (to_char(current_date, 'YYYY-MM'),                       'Ăn uống',    4000000),
  (to_char(current_date, 'YYYY-MM'),                       'Di chuyển',  1500000),
  (to_char(current_date, 'YYYY-MM'),                       'Mua sắm',    2500000),
  (to_char(current_date - interval '1 month', 'YYYY-MM'),  null,        11000000)
on conflict (
  coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
  month,
  coalesce(category, '__ALL__')
) do update set amount = excluded.amount, updated_at = now();

-- --------------------------- GIAO DỊCH (TRANSACTIONS) ------------------------
-- THU NHẬP: lương + thu khác cho 6 tháng gần nhất
insert into public.transactions (type, amount, category, date, notes) values
  ('income', 20000000, 'Lương',        (date_trunc('month', current_date) + interval '4 day')::date,  '[mock] Lương tháng này'),
  ('income',  2500000, 'Thưởng',       (date_trunc('month', current_date) + interval '9 day')::date,  '[mock] Thưởng dự án'),
  ('income',  1200000, 'Đầu tư',       (date_trunc('month', current_date) + interval '14 day')::date, '[mock] Cổ tức'),
  ('income', 20000000, 'Lương',        (date_trunc('month', current_date - interval '1 month') + interval '4 day')::date, '[mock] Lương tháng trước'),
  ('income', 20000000, 'Lương',        (date_trunc('month', current_date - interval '2 month') + interval '4 day')::date, '[mock] Lương'),
  ('income', 20000000, 'Lương',        (date_trunc('month', current_date - interval '3 month') + interval '4 day')::date, '[mock] Lương'),
  ('income', 20000000, 'Lương',        (date_trunc('month', current_date - interval '4 month') + interval '4 day')::date, '[mock] Lương'),
  ('income', 20000000, 'Lương',        (date_trunc('month', current_date - interval '5 month') + interval '4 day')::date, '[mock] Lương');

-- CHI TIÊU tháng hiện tại
insert into public.transactions (type, amount, category, date, notes) values
  ('expense',   45000, 'Ăn uống',   (current_date - interval '0 day')::date,  '[mock] Cơm trưa văn phòng'),
  ('expense',   35000, 'Ăn uống',   (current_date - interval '1 day')::date,  '[mock] Cà phê'),
  ('expense',  250000, 'Ăn uống',   (current_date - interval '2 day')::date,  '[mock] Ăn tối cùng bạn'),
  ('expense',   60000, 'Di chuyển', (current_date - interval '1 day')::date,  '[mock] Grab đi làm'),
  ('expense',  120000, 'Di chuyển', (current_date - interval '3 day')::date,  '[mock] Đổ xăng'),
  ('expense',  890000, 'Mua sắm',   (current_date - interval '2 day')::date,  '[mock] Áo khoác mùa đông'),
  ('expense',  350000, 'Mua sắm',   (current_date - interval '5 day')::date,  '[mock] Đồ gia dụng'),
  ('expense',  450000, 'Hoá đơn',   (current_date - interval '4 day')::date,  '[mock] Tiền điện'),
  ('expense',  200000, 'Hoá đơn',   (current_date - interval '4 day')::date,  '[mock] Internet'),
  ('expense',  180000, 'Giải trí',  (current_date - interval '6 day')::date,  '[mock] Vé xem phim'),
  ('expense',  300000, 'Sức khỏe',  (current_date - interval '7 day')::date,  '[mock] Thuốc + khám'),
  ('expense',   90000, 'Ăn uống',   (current_date - interval '8 day')::date,  '[mock] Trà sữa nhóm');

-- CHI TIÊU tháng trước
insert into public.transactions (type, amount, category, date, notes) values
  ('expense', 3800000, 'Ăn uống',   (date_trunc('month', current_date - interval '1 month') + interval '10 day')::date, '[mock] Tổng ăn uống'),
  ('expense', 1400000, 'Di chuyển', (date_trunc('month', current_date - interval '1 month') + interval '12 day')::date, '[mock] Xăng + Grab'),
  ('expense', 2100000, 'Mua sắm',   (date_trunc('month', current_date - interval '1 month') + interval '15 day')::date, '[mock] Mua sắm tổng'),
  ('expense',  850000, 'Hoá đơn',   (date_trunc('month', current_date - interval '1 month') + interval '5 day')::date,  '[mock] Điện nước internet'),
  ('expense',  600000, 'Giải trí',  (date_trunc('month', current_date - interval '1 month') + interval '20 day')::date, '[mock] Du lịch ngắn');

-- CHI TIÊU các tháng trước nữa (cho biểu đồ xu hướng 6 tháng)
insert into public.transactions (type, amount, category, date, notes) values
  ('expense', 7200000, 'Ăn uống',   (date_trunc('month', current_date - interval '2 month') + interval '15 day')::date, '[mock] Chi tiêu tháng'),
  ('expense', 6800000, 'Mua sắm',   (date_trunc('month', current_date - interval '3 month') + interval '15 day')::date, '[mock] Chi tiêu tháng'),
  ('expense', 9100000, 'Hoá đơn',   (date_trunc('month', current_date - interval '4 month') + interval '15 day')::date, '[mock] Chi tiêu tháng'),
  ('expense', 5400000, 'Di chuyển', (date_trunc('month', current_date - interval '5 month') + interval '15 day')::date, '[mock] Chi tiêu tháng');
