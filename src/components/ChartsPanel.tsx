"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { getColorStyle } from "@/lib/categories";
import { formatCompactVND, formatVND, getMonthLabel } from "@/lib/format";
import type { CategoryStat } from "@/types";

interface TrendPoint {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

interface Props {
  categoryStats: CategoryStat[];
  trend: TrendPoint[];
  findColor: (name: string) => string;
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.25)",
  fontSize: 12,
};

export function ChartsPanel({ categoryStats, trend, findColor }: Props) {
  const pieData = categoryStats
    .filter((s) => s.amount > 0)
    .map((s) => ({
      name: s.name,
      value: s.amount,
      fill: getColorStyle(findColor(s.name)).hex,
    }));

  const trendData = trend.map((t) => ({
    ...t,
    label: getMonthLabel(t.month).replace("Tháng ", "T"),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card rounded-2xl p-4 md:p-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
          Phân bổ chi tiêu
        </h3>
        {pieData.length === 0 ? (
          <EmptyChart text="Chưa có chi tiêu để vẽ biểu đồ." />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatVND(Number(value ?? 0))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {pieData.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {pieData.slice(0, 6).map((p) => (
              <span key={p.name} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4 md:p-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
          Xu hướng 6 tháng
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompactVND(Number(v))} width={44} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatVND(Number(value ?? 0))}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Chi tiêu"
                stroke="#f43f5e"
                fill="url(#expGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 md:p-5 lg:col-span-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
          So sánh thu vs chi
        </h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompactVND(Number(v))} width={44} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatVND(Number(value ?? 0))}
              />
              <Legend />
              <Bar dataKey="income" name="Thu" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Chi" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-56 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
      {text}
    </div>
  );
}
