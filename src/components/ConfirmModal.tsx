"use client";

import { X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  danger,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm glass-card rounded-2xl p-5 shadow-xl animate-slide-up">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 pr-8">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:opacity-90"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 ${
              danger ? "bg-rose-600" : "bg-indigo-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
