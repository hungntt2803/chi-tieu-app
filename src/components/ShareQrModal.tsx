"use client";

import { useEffect, useState } from "react";
import { Check, Copy, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  open: boolean;
  onClose: () => void;
}

function resolveAppUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function ShareQrModal({ open, onClose }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setUrl(resolveAppUrl());
  }, [open]);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm glass-card rounded-3xl p-5 md:p-6 shadow-xl animate-slide-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-1 pr-8">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <QrCode className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Quét để mở app
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Dùng camera điện thoại quét mã QR để mở Chi Tiêu App trên trình duyệt.
        </p>

        <div className="flex justify-center py-4 rounded-2xl bg-white border border-slate-100 dark:border-zinc-800 dark:bg-zinc-950">
          {url ? (
            <QRCodeSVG
              value={url}
              size={184}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          ) : (
            <div className="w-[184px] h-[184px] flex items-center justify-center text-xs text-slate-400">
              Đang tạo mã…
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 min-w-0 text-[11px] font-medium bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-slate-600 dark:text-zinc-300 outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Đã chép" : "Sao chép"}
          </button>
        </div>
      </div>
    </div>
  );
}
