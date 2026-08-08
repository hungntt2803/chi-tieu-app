import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase";

/** Trả 503 nếu thiếu biến môi trường Supabase (tránh crash mơ hồ trên Vercel). */
export function requireSupabaseEnv() {
  if (hasSupabaseEnv) return null;
  return NextResponse.json(
    {
      error:
        "Thiếu cấu hình Supabase. Thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY) trên Vercel → Settings → Environment Variables.",
    },
    { status: 503 }
  );
}
