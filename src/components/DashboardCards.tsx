"use client";

import { TrendingDown, TrendingUp, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatVND, percentChange } from "@/lib/format";

interface Summary {
  income: number;
  expense: number;
  balance: number;
}

interface Props {
  current: Summary;
  previous: Summary;
  loading?: boolean;
}

function ChangeBadge({ current, previous, invert }: { current: number; previous: number; invert?: boolean }) {
  const pct = percentChange(current, previous);
  if (previous === 0 && current === 0) return null;
  const up = pct > 0;
  const good = invert ? !up : up;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
        good
          ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400"
      }`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {pct}% so với tháng trước
    </span>
  );
}

export function DashboardCards({ current, previous, loading }: Props) {
  const cards = [
    {
      key: "balance",
      label: "Số dư tháng",
      value: current.balance,
      icon: Wallet,
      accent: current.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      bg: "from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10",
      invert: false,
      compare: { current: current.balance, previous: previous.balance },
    },
    {
      key: "income",
      label: "Tổng thu",
      value: current.income,
      icon: ArrowDownLeft,
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "from-white to-emerald-50/50 dark:from-zinc-900/40 dark:to-emerald-950/10",
      invert: false,
      compare: { current: current.income, previous: previous.income },
    },
    {
      key: "expense",
      label: "Tổng chi",
      value: current.expense,
      icon: ArrowUpRight,
      accent: "text-rose-600 dark:text-rose-400",
      bg: "from-white to-rose-50/50 dark:from-zinc-900/40 dark:to-rose-950/10",
      invert: true,
      compare: { current: current.expense, previous: previous.expense },
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={`glass-card rounded-2xl p-4 md:p-5 bg-gradient-to-br ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg bg-white/60 dark:bg-zinc-800/60 ${card.accent}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className={`text-2xl md:text-3xl font-black tracking-tight ${card.accent}`}>
              {loading ? "…" : formatVND(card.value)}
            </div>
            <div className="mt-2">
              <ChangeBadge
                current={card.compare.current}
                previous={card.compare.previous}
                invert={card.invert}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
