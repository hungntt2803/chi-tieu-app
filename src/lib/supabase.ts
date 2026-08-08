import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseKey);

if (!hasSupabaseEnv && process.env.NODE_ENV !== "production") {
  console.warn(
    "⚠️ Supabase environment variables are missing! " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
      "(or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
  );
}

// Dùng placeholder khi thiếu env để `next build` / Vercel không crash lúc collect page data.
// Runtime API sẽ trả lỗi rõ ràng nếu chưa cấu hình.
const url = hasSupabaseEnv ? supabaseUrl : "https://placeholder.supabase.co";
const key = hasSupabaseEnv ? supabaseKey : "public-anon-key";

export const supabase: SupabaseClient = createClient(url, key);
