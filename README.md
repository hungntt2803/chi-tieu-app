# Chi Tiêu App — Quản lý tài chính cá nhân

Ứng dụng theo dõi thu chi cá nhân (tiếng Việt), xây dựng bằng **Next.js 16
(App Router) + React 19 + Tailwind CSS v4 + Supabase Auth + lucide-react + recharts**.

## Tính năng chính

- Đăng nhập **magic link (email)** — mỗi người một tài khoản, dữ liệu tách biệt (RLS).
- Thu / chi, danh mục, ngân sách theo tháng & theo danh mục.
- Dashboard + biểu đồ, lọc nâng cao, mã QR chia sẻ, dark mode, PWA.

## Cấu hình môi trường

`.env.local` / Vercel Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Thiết lập Supabase (bắt buộc cho multi-user)

### 1. SQL migrations (SQL Editor, lần lượt)

1. `supabase/migrations/0001_init_finance_schema.sql`
2. `supabase/migrations/0002_seed_default_categories.sql`
3. `supabase/migrations/0003_recurring_transactions.sql`
4. **`supabase/migrations/0004_enable_auth_rls.sql`** ← bật RLS theo user

> Dữ liệu cũ không có `user_id` sẽ **không hiện** sau khi bật RLS (đúng ý: mỗi user bắt đầu sạch).
> Muốn giữ mock cho 1 user: sau khi đăng nhập, lấy `user id` trong Authentication → Users rồi
> `update transactions set user_id = '<uuid>' where user_id is null;` (tương tự budgets).

### 2. Auth settings

Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: `https://your-app.vercel.app` (hoặc `http://localhost:3000` khi dev)
- **Redirect URLs** thêm:
  - `http://localhost:3000/auth/callback`
  - `https://your-app.vercel.app/auth/callback`

Bật **Email** provider (magic link / OTP). Kiểm tra inbox (và Spam) khi nhận link.

## Chạy local

```bash
npm install
npm run dev
```

Mở `/login` → nhập email → mở link trong email → vào app.

## Cấu trúc

```
src/
  app/login/                   # Trang đăng nhập
  app/auth/callback/           # Đổi code → session
  middleware.ts                # Bảo vệ route + refresh session
  app/api/...                  # API gắn user_id + RLS
  lib/supabase/{client,server,middleware,env}.ts
supabase/migrations/0004_enable_auth_rls.sql
```
