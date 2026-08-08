"use client";

import { formatVND } from "@/lib/format";
import { getColorStyle } from "@/lib/categories";
import type { Budget, CategoryConfig, CategoryStat } from "@/types";

interface Props {
  budgets: Budget[];
  categoryStats: CategoryStat[];
  categories: CategoryConfig[];
  onSave: (category: string, amount: number) => Promise<void>;
}

export function CategoryBudgetPanel({
  budgets,
  categoryStats,
  categories,
  onSave,
}: Props) {
  const expenseCats = categories.filter((c) => c.type === "expense");

  return (
    <div className="glass-card rounded-2xl p-4 md:p-5 space-y-3">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
        Ngân sách theo danh mục
      </h3>
      {expenseCats.map((cat) => {
        const spent =
          categoryStats.find((s) => s.name === cat.name)?.amount ?? 0;
        const budget =
          budgets.find((b) => b.category === cat.name)?.amount ?? 0;
        const ratio = budget > 0 ? (spent / budget) * 100 : 0;
        const warn = ratio >= 90;
        const style = getColorStyle(cat.color);

        return (
          <div key={cat.name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-zinc-200">
                {cat.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">
                  {formatVND(spent)}
                  {budget > 0 ? ` / ${formatVND(budget)}` : ""}
                </span>
                <button
                  type="button"
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  onClick={async () => {
                    const raw = window.prompt(
                      `Hạn mức cho ${cat.name} (VND)`,
                      budget ? String(budget) : ""
                    );
                    if (raw === null) return;
                    const val = parseFloat(raw.replace(/[^0-9]/g, ""));
                    if (!isNaN(val) && val >= 0) await onSave(cat.name, val);
                  }}
                >
                  Đặt
                </button>
              </div>
            </div>
            {budget > 0 && (
              <>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      warn ? "bg-rose-500" : style.bar
                    }`}
                    style={{ width: `${Math.min(ratio, 100)}%` }}
                  />
                </div>
                {warn && (
                  <p className="text-[11px] font-bold text-rose-500">
                    {spent >= budget
                      ? "Đã vượt hạn mức danh mục!"
                      : "Sắp hết hạn mức (≥90%)."}
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
