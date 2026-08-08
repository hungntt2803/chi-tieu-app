"use client";

import { Check, Loader2, Plus, X } from "lucide-react";
import type { CategoryConfig, Transaction, TransactionType } from "@/types";
import { getColorStyle, getIcon } from "@/lib/categories";

interface Props {
  open: boolean;
  editing: Transaction | null;
  loading: boolean;
  amount: string;
  setAmount: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  txType: TransactionType;
  setTxType: (v: TransactionType) => void;
  categories: CategoryConfig[];
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function TransactionFormModal({
  open,
  editing,
  loading,
  amount,
  setAmount,
  category,
  setCategory,
  date,
  setDate,
  notes,
  setNotes,
  txType,
  setTxType,
  categories,
  onSubmit,
  onClose,
}: Props) {
  if (!open) return null;

  const filtered = categories.filter((c) => c.type === txType);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto glass-card rounded-t-3xl sm:rounded-3xl p-5 md:p-6 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {editing ? "Cập nhật giao dịch" : "Thêm giao dịch"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 dark:bg-zinc-800/60 rounded-2xl">
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTxType(t);
                  const first = categories.find((c) => c.type === t);
                  if (first) setCategory(first.name);
                }}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                  txType === t
                    ? t === "expense"
                      ? "bg-rose-500 text-white shadow"
                      : "bg-emerald-500 text-white shadow"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {t === "expense" ? "Chi tiêu" : "Thu nhập"}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Số tiền (VND) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                ₫
              </span>
              <input
                type="text"
                required
                inputMode="numeric"
                disabled={loading}
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(val ? Number(val).toLocaleString("vi-VN") : "");
                }}
                className="w-full bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl pl-10 pr-4 py-3.5 text-slate-800 dark:text-zinc-100 font-bold text-lg outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Danh mục *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map((cat) => {
                const Icon = getIcon(cat.icon);
                const style = getColorStyle(cat.color);
                const selected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    disabled={loading}
                    onClick={() => setCategory(cat.name)}
                    className={`relative flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-center transition-all ${
                      selected
                        ? `${style.bg} ${style.border} ring-2 ring-indigo-500/20`
                        : "border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300 leading-tight">
                      {cat.name}
                    </span>
                    {selected && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                        <Check className="w-2 h-2" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Ngày *
            </label>
            <input
              type="date"
              required
              disabled={loading}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Ghi chú
            </label>
            <input
              type="text"
              disabled={loading}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: cơm trưa, lương tháng..."
              className="w-full bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editing ? "Lưu thay đổi" : "Thêm giao dịch"}
          </button>
        </form>
      </div>
    </div>
  );
}
