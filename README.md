# Chi Tiêu App — Quản lý tài chính cá nhân

Ứng dụng theo dõi thu chi cá nhân (tiếng Việt), xây dựng bằng **Next.js 16
(App Router) + React 19 + Tailwind CSS v4 + Supabase + lucide-react + recharts**.

## Tính năng

### Giai đoạn 1 — Nền tảng
- Thêm / sửa / xóa giao dịch theo tháng.
- **Thu nhập** và **Chi tiêu** (`type`).
- Danh mục động từ Supabase (fallback mặc định).
- Hạn mức tháng lưu trên Supabase + cache localStorage.

### Giai đoạn 2 — App thực tế
- Dashboard: số dư, tổng thu, tổng chi + % so với tháng trước.
- Biểu đồ: donut phân bổ chi, area xu hướng 6 tháng, bar thu vs chi.
- Ngân sách theo từng danh mục + cảnh báo ≥90%.
- Giao dịch định kỳ (`recurring_transactions`) — tự phát sinh khi mở app.
- Lọc nâng cao (loại, danh mục, khoảng số tiền) + tìm kiếm.
- Mã QR chia sẻ link app (nút trên header).
- Toggle Dark/Light, PWA (manifest + service worker).
- Toast (sonner), modal thêm giao dịch (FAB), modal xác nhận xóa.

## Cấu hình

Tạo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
```

## Thiết lập database (Supabase SQL Editor)

Chạy lần lượt:

1. `supabase/migrations/0001_init_finance_schema.sql`
2. `supabase/migrations/0002_seed_default_categories.sql`
3. `supabase/migrations/0003_recurring_transactions.sql`
4. (Khuyến nghị) `supabase/seed/mock_transactions.sql` — dữ liệu mẫu 6 tháng

## Chạy

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run lint
```

## Cấu trúc

```
src/
  app/page.tsx                 # UI chính
  app/api/{transactions,categories,budgets,stats,recurring}/
  components/                  # Dashboard, Charts, Form, List, Theme...
  hooks/useLocalStorage.ts
  lib/{supabase,categories,format}.ts
  types/index.ts
supabase/migrations|seed/
public/{manifest.webmanifest,sw.js,icon-*.png}
```
