import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { User } from "@supabase/supabase-js";

export { hasSupabaseEnv };

export function missingEnvResponse() {
  return NextResponse.json(
    {
      error:
        "Thiếu cấu hình Supabase. Thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY trên Vercel.",
    },
    { status: 503 }
  );
}

export async function requireUser(): Promise<
  | { error: NextResponse; supabase?: undefined; user?: undefined }
  | { error?: undefined; supabase: Awaited<ReturnType<typeof createClient>>; user: User }
> {
  if (!hasSupabaseEnv()) {
    return { error: missingEnvResponse() };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: "Bạn cần đăng nhập để tiếp tục." },
        { status: 401 }
      ),
    };
  }

  return { supabase, user };
}
