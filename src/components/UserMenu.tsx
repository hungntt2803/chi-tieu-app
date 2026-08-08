"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import type { User as SbUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<SbUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Đã đăng xuất.");
    router.push("/login");
    router.refresh();
  };

  if (!user) return null;

  const label = user.email?.split("@")[0] || "Tài khoản";

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-600 dark:text-zinc-300 max-w-[140px]"
        title={user.email || ""}
      >
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <button
        type="button"
        onClick={logout}
        className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300"
        aria-label="Đăng xuất"
        title="Đăng xuất"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
