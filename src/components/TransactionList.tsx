"use client";

import { Edit2, Trash2 } from "lucide-react";
import type { CategoryConfig, Transaction } from "@/types";
import { getColorStyle, getIcon } from "@/lib/categories";
import { formatVND, getVietnameseDateString } from "@/lib/format";

interface Props {
  transactions: Transaction[];
  findCategory: (name: string) => CategoryConfig;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function TransactionList({
  transactions,
  findCategory,
  onEdit,
  onDelete,
  loading,
}: Props) {
  const groups: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  if (Object.keys(groups).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-14 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <span className="text-2xl opacity-40">∅</span>
        </div>
        <h3 className="text-sm font-bold text-slate-600 dark:text-zinc-300">
          Không có giao dịch
        </h3>
        <p className="text-xs mt-1 max-w-xs">
          Thêm giao dịch đầu tiên bằng nút + ở góc dưới.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[560px] overflow-y-auto pr-1">
      {Object.entries(groups).map(([dateStr, items]) => {
        const dayTotal = items.reduce(
          (acc, t) => acc + (t.type === "income" ? t.amount : -t.amount),
          0
        );
        return (
          <div key={dateStr} className="space-y-2">
            <div className="flex justify-between items-center bg-slate-100/60 dark:bg-zinc-800/40 px-3 py-2 rounded-xl sticky top-0 backdrop-blur-sm z-10">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                {getVietnameseDateString(dateStr)}
              </span>
              <span
                className={`text-xs font-bold ${
                  dayTotal >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {dayTotal >= 0 ? "+" : ""}
                {formatVND(dayTotal)}
              </span>
            </div>

            {items.map((t) => {
              const cat = findCategory(t.category);
              const Icon = getIcon(cat.icon);
              const style = getColorStyle(cat.color);
              const isIncome = t.type === "income";
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100/80 dark:border-zinc-800/50 glass-panel hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${style.bg} ${style.text} border ${style.border}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                          {t.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? "Thu" : "Chi"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-[280px]">
                        {t.notes || "Không có ghi chú"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-sm font-bold ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-900 dark:text-zinc-100"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatVND(t.amount)}
                    </span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onEdit(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                      aria-label="Sửa"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onDelete(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      aria-label="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
