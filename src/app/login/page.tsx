"use client";

import { FormEvent, useState } from "react";
import { Loader2, Mail, Wallet } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo =
        (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
          window.location.origin) + "/auth/callback";

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;
      setSent(true);
      toast.success("Đã gửi link đăng nhập tới email của bạn.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không gửi được email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Chi Tiêu App
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Đăng nhập để quản lý thu chi riêng của bạn — dữ liệu được tách theo từng
          tài khoản.
        </p>

        {sent ? (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-950/20 p-4 text-sm text-emerald-800 dark:text-emerald-300">
            <p className="font-bold mb-1">Kiểm tra hộp thư</p>
            <p className="opacity-90 leading-relaxed">
              Chúng tôi đã gửi link đăng nhập tới <strong>{email}</strong>. Mở
              email trên điện thoại/máy tính này và nhấn vào link để vào app.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-3 text-xs font-bold underline"
            >
              Gửi lại với email khác
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@email.com"
                  className="w-full bg-slate-50/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Gửi link đăng nhập
            </button>
          </form>
        )}

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-5 leading-relaxed">
          Không cần mật khẩu. Mỗi email = một tài khoản riêng, không xem được dữ
          liệu của người khác.
        </p>
      </div>
    </div>
  );
}
