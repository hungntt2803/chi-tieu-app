"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  Calendar,
  Download,
  Filter,
  Loader2,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type {
  Budget,
  CategoryConfig,
  CategoryStat,
  Transaction,
  TransactionType,
} from "@/types";
import { DEFAULT_CATEGORIES, getDefaultCategoriesByType } from "@/lib/categories";
import {
  exportTransactionsCsv,
  formatVND,
  getMonthLabel,
  getMonthOptions,
} from "@/lib/format";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTheme } from "@/components/ThemeProvider";
import { DashboardCards } from "@/components/DashboardCards";
import { CategoryBudgetPanel } from "@/components/CategoryBudgetPanel";
import { TransactionList } from "@/components/TransactionList";
import { TransactionFormModal } from "@/components/TransactionFormModal";
import { ConfirmModal } from "@/components/ConfirmModal";

const ChartsPanel = dynamic(
  () => import("@/components/ChartsPanel").then((m) => m.ChartsPanel),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-400">
        Đang tải biểu đồ…
      </div>
    ),
  }
);

type Summary = { income: number; expense: number; balance: number };
type TrendPoint = { month: string; income: number; expense: number; balance: number };

export default function ExpenseTracker() {
  const { theme, toggleTheme } = useTheme();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [current, setCurrent] = useState<Summary>({ income: 0, expense: 0, balance: 0 });
  const [previous, setPrevious] = useState<Summary>({ income: 0, expense: 0, balance: 0 });
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [cachedBudget, setCachedBudget] = useLocalStorage("monthly_budget", 10_000_000);
  const [budget, setBudgetState] = useState(cachedBudget);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Ăn uống");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [txType, setTxType] = useState<TransactionType>("expense");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState("Tất cả");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const findCategory = useCallback(
    (name: string): CategoryConfig =>
      categories.find((c) => c.name === name) ?? {
        name,
        icon: "HelpCircle",
        color: "slate",
        type: "expense",
      },
    [categories]
  );

  const loadSeq = useRef(0);

  const loadData = useCallback(async (monthStr: string) => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setApiError(null);
    try {
      const [txRes, statsRes, budgetRes] = await Promise.all([
        fetch(`/api/transactions?month=${monthStr}`),
        fetch(`/api/stats?month=${monthStr}`),
        fetch(`/api/budgets?month=${monthStr}`),
      ]);

      const txData = await txRes.json();
      if (!txRes.ok) throw new Error(txData.error || "Không thể tải giao dịch.");

      let nextCurrent = {
        income: txData.totalMonthlyIncome || 0,
        expense: txData.totalMonthlySpend || 0,
        balance: txData.balance || 0,
      };
      let nextPrevious = { income: 0, expense: 0, balance: 0 };
      let nextStats: CategoryStat[] = txData.categoryStats || [];
      let nextTrend: TrendPoint[] = [];

      if (statsRes.ok) {
        const stats = await statsRes.json();
        nextCurrent = stats.current || nextCurrent;
        nextPrevious = stats.previous || nextPrevious;
        nextStats = stats.categoryStats || nextStats;
        nextTrend = stats.trend || [];
      }

      let nextBudgets: Budget[] = [];
      let nextOverall: number | null = null;
      if (budgetRes.ok) {
        const b = await budgetRes.json();
        nextBudgets = b.budgets || [];
        if (typeof b.overall === "number" && b.overall > 0) nextOverall = b.overall;
      }

      if (seq !== loadSeq.current) return;

      setTransactions(txData.transactions || []);
      setCurrent(nextCurrent);
      setPrevious(nextPrevious);
      setCategoryStats(nextStats);
      setTrend(nextTrend);
      setBudgets(nextBudgets);
      if (nextOverall !== null) setBudgetState(nextOverall);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setApiError(err instanceof Error ? err.message : "Không thể kết nối máy chủ.");
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.categories?.length) setCategories(data.categories);
      } catch {
        /* fallback already set */
      }
      try {
        await fetch("/api/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "run" }),
        });
      } catch {
        /* optional */
      }
    })();
  }, []);

  useEffect(() => {
    void loadData(selectedMonth);
  }, [selectedMonth, loadData]);

  const filteredTransactions = useMemo(() => {
    const min = parseFloat(minAmount.replace(/[^0-9]/g, "")) || 0;
    const max = parseFloat(maxAmount.replace(/[^0-9]/g, "")) || Infinity;
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "Tất cả" && t.category !== categoryFilter) return false;
      if (t.amount < min || t.amount > max) return false;
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        t.notes.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [transactions, typeFilter, categoryFilter, searchQuery, minAmount, maxAmount]);

  const openCreate = () => {
    setEditing(null);
    setAmount("");
    setNotes("");
    setTxType("expense");
    setCategory(getDefaultCategoriesByType("expense")[0]?.name || "Ăn uống");
    setDate(new Date().toISOString().split("T")[0]);
    setFormOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setAmount(t.amount.toLocaleString("vi-VN"));
    setCategory(t.category);
    setDate(t.date);
    setNotes(t.notes);
    setTxType(t.type || "expense");
    setFormOpen(true);
  };

  const saveBudget = async (value: number, categoryName: string | null = null) => {
    if (categoryName === null) {
      setBudgetState(value);
      setCachedBudget(value);
    }
    try {
      const res = await fetch("/api/budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, category: categoryName, amount: value }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không lưu được hạn mức.");
      }
      const saved = await res.json();
      setBudgets((prev) => {
        const idx = prev.findIndex((b) => b.category === categoryName);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], amount: saved.amount, id: saved.id };
          return next;
        }
        return [...prev, saved];
      });
      toast.success("Đã lưu hạn mức.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi lưu hạn mức.");
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    if (!date) {
      toast.error("Vui lòng chọn ngày.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: txType,
        amount: parsedAmount,
        category,
        date,
        notes: notes.trim(),
      };

      const res = await fetch("/api/transactions", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu giao dịch.");

      toast.success(editing ? "Đã cập nhật giao dịch." : "Đã thêm giao dịch.");
      setFormOpen(false);
      setEditing(null);
      await loadData(selectedMonth);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions?id=${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể xóa.");
      toast.success("Đã xóa giao dịch.");
      setDeleteId(null);
      await loadData(selectedMonth);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi xóa.");
    } finally {
      setSaving(false);
    }
  };

  const budgetRatio = budget > 0 ? (current.expense / budget) * 100 : 0;
  const isBudgetWarning = budgetRatio >= 90;

  return (
    <div className="flex-1 min-h-screen px-4 py-6 md:py-10 max-w-7xl mx-auto w-full pb-24">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
              <Wallet className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Chi Tiêu App
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Quản lý thu chi cá nhân thông minh và đơn giản.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300"
            aria-label="Đổi giao diện sáng/tối"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() =>
              exportTransactionsCsv(
                filteredTransactions,
                `chi-tieu-${selectedMonth}.csv`
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-600 dark:text-zinc-300"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất CSV
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={false}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-semibold rounded-xl px-3 py-2 outline-none"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt} value={opt}>
                  {getMonthLabel(opt)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => loadData(selectedMonth)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            aria-label="Tải lại"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {apiError && (
        <section className="mb-6">
          <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 rounded-2xl">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Lỗi kết nối</h3>
              <p className="text-xs mt-1 opacity-90">{apiError}</p>
              <button
                type="button"
                onClick={() => loadData(selectedMonth)}
                className="mt-2 text-xs font-bold underline"
              >
                Thử lại
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mb-6 animate-slide-up delay-100">
        <DashboardCards current={current} previous={previous} loading={loading} />
      </section>

      <section className="mb-6 glass-card rounded-3xl p-5 md:p-6 animate-slide-up delay-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hạn mức tháng · {getMonthLabel(selectedMonth)}
            </span>
            {isEditingBudget ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={tempBudget}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setTempBudget(val ? Number(val).toLocaleString("vi-VN") : "");
                  }}
                  className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl text-sm font-bold w-40 outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  className="text-xs font-bold text-emerald-600"
                  onClick={async () => {
                    const val = parseFloat(tempBudget.replace(/[^0-9]/g, ""));
                    if (!isNaN(val) && val >= 0) {
                      await saveBudget(val, null);
                      setIsEditingBudget(false);
                    } else toast.error("Hạn mức không hợp lệ.");
                  }}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="text-xs font-bold text-rose-500"
                  onClick={() => {
                    setIsEditingBudget(false);
                    setTempBudget(budget.toLocaleString("vi-VN"));
                  }}
                >
                  Hủy
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-black text-slate-800 dark:text-zinc-100">
                  {budget === 0 ? "Chưa đặt" : formatVND(budget)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempBudget(budget > 0 ? budget.toLocaleString("vi-VN") : "");
                    setIsEditingBudget(true);
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
                >
                  Sửa
                </button>
              </div>
            )}
          </div>

          {budget > 0 && (
            <div className="w-full md:max-w-md space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Đã chi {Math.round(budgetRatio)}%</span>
                <span className={isBudgetWarning ? "text-rose-500" : "text-indigo-600 dark:text-indigo-400"}>
                  {current.expense >= budget
                    ? `Vượt ${formatVND(current.expense - budget)}`
                    : `Còn ${formatVND(budget - current.expense)}`}
                </span>
              </div>
              <div className="w-full bg-slate-200/60 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isBudgetWarning ? "bg-rose-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${Math.min(budgetRatio, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-6 animate-slide-up delay-200">
        <ChartsPanel
          categoryStats={categoryStats}
          trend={trend}
          findColor={(name) => findCategory(name).color}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-4 space-y-4">
          <CategoryBudgetPanel
            budgets={budgets}
            categoryStats={categoryStats}
            categories={categories}
            onSave={(cat, amountVal) => saveBudget(amountVal, cat)}
          />
        </section>

        <section className="lg:col-span-8">
          <div className="glass-card rounded-3xl p-5 md:p-6 min-h-[420px]">
            <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Lịch sử giao dịch
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Lọc nâng cao
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm ghi chú, danh mục..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold rounded-xl px-3 py-2"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="expense">Chi tiêu</option>
                  <option value="income">Thu nhập</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold rounded-xl px-3 py-2"
                >
                  <option value="Tất cả">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={`${c.type}-${c.name}`} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Số tiền tối thiểu"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Số tiền tối đa"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              )}
            </div>

            {loading && transactions.length === 0 ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <TransactionList
                transactions={filteredTransactions}
                findCategory={findCategory}
                onEdit={openEdit}
                onDelete={(id) => setDeleteId(id)}
                loading={saving}
              />
            )}
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={openCreate}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center"
        aria-label="Thêm giao dịch"
      >
        <Plus className="h-6 w-6" />
      </button>

      <TransactionFormModal
        open={formOpen}
        editing={editing}
        loading={saving}
        amount={amount}
        setAmount={setAmount}
        category={category}
        setCategory={setCategory}
        date={date}
        setDate={setDate}
        notes={notes}
        setNotes={setNotes}
        txType={txType}
        setTxType={setTxType}
        categories={categories}
        onSubmit={handleSaveTransaction}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmModal
        open={!!deleteId}
        title="Xóa giao dịch?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
