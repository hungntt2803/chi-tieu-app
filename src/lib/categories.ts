import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  HelpCircle,
  Wallet,
  Gift,
  TrendingUp,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";
import type { CategoryConfig, TransactionType } from "@/types";

// Ánh xạ tên icon (string lưu trong DB) -> component icon lucide-react.
export const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  HelpCircle,
  Wallet,
  Gift,
  TrendingUp,
  CircleDollarSign,
};

export const getIcon = (name: string): LucideIcon => ICON_MAP[name] ?? HelpCircle;

// Bảng màu app: mỗi khóa màu -> bộ class Tailwind dùng nhất quán toàn UI.
export interface ColorStyle {
  text: string;
  bg: string;
  border: string;
  hover: string;
  bar: string;
  hex: string; // dùng cho biểu đồ (recharts) ở Giai đoạn 2
}

export const COLOR_PALETTE: Record<string, ColorStyle> = {
  orange: {
    text: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-900/50",
    hover: "hover:bg-orange-100/50 dark:hover:bg-orange-900/20",
    bar: "bg-orange-500",
    hex: "#f97316",
  },
  blue: {
    text: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/50",
    hover: "hover:bg-blue-100/50 dark:hover:bg-blue-900/20",
    bar: "bg-blue-500",
    hex: "#3b82f6",
  },
  pink: {
    text: "text-pink-500 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    border: "border-pink-200 dark:border-pink-900/50",
    hover: "hover:bg-pink-100/50 dark:hover:bg-pink-900/20",
    bar: "bg-pink-500",
    hex: "#ec4899",
  },
  amber: {
    text: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900/50",
    hover: "hover:bg-amber-100/50 dark:hover:bg-amber-900/20",
    bar: "bg-amber-500",
    hex: "#f59e0b",
  },
  violet: {
    text: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-900/50",
    hover: "hover:bg-violet-100/50 dark:hover:bg-violet-900/20",
    bar: "bg-violet-500",
    hex: "#8b5cf6",
  },
  rose: {
    text: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-900/50",
    hover: "hover:bg-rose-100/50 dark:hover:bg-rose-900/20",
    bar: "bg-rose-500",
    hex: "#f43f5e",
  },
  cyan: {
    text: "text-cyan-500 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    border: "border-cyan-200 dark:border-cyan-900/50",
    hover: "hover:bg-cyan-100/50 dark:hover:bg-cyan-900/20",
    bar: "bg-cyan-500",
    hex: "#06b6d4",
  },
  emerald: {
    text: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900/50",
    hover: "hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20",
    bar: "bg-emerald-500",
    hex: "#10b981",
  },
  green: {
    text: "text-green-500 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-900/50",
    hover: "hover:bg-green-100/50 dark:hover:bg-green-900/20",
    bar: "bg-green-500",
    hex: "#22c55e",
  },
  teal: {
    text: "text-teal-500 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-900/50",
    hover: "hover:bg-teal-100/50 dark:hover:bg-teal-900/20",
    bar: "bg-teal-500",
    hex: "#14b8a6",
  },
  lime: {
    text: "text-lime-500 dark:text-lime-400",
    bg: "bg-lime-50 dark:bg-lime-950/30",
    border: "border-lime-200 dark:border-lime-900/50",
    hover: "hover:bg-lime-100/50 dark:hover:bg-lime-900/20",
    bar: "bg-lime-500",
    hex: "#84cc16",
  },
  slate: {
    text: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-800/50",
    hover: "hover:bg-slate-100/50 dark:hover:bg-slate-800/20",
    bar: "bg-slate-500",
    hex: "#64748b",
  },
};

export const getColorStyle = (color: string): ColorStyle =>
  COLOR_PALETTE[color] ?? COLOR_PALETTE.slate;

// Danh mục mặc định — đồng bộ với supabase/migrations/0002_seed_default_categories.sql.
// Dùng làm fallback khi chưa tải được danh mục từ DB.
export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { name: "Ăn uống", icon: "Utensils", color: "orange", type: "expense", isDefault: true, sortOrder: 1 },
  { name: "Di chuyển", icon: "Car", color: "blue", type: "expense", isDefault: true, sortOrder: 2 },
  { name: "Mua sắm", icon: "ShoppingBag", color: "pink", type: "expense", isDefault: true, sortOrder: 3 },
  { name: "Hoá đơn", icon: "Receipt", color: "amber", type: "expense", isDefault: true, sortOrder: 4 },
  { name: "Giải trí", icon: "Gamepad2", color: "violet", type: "expense", isDefault: true, sortOrder: 5 },
  { name: "Sức khỏe", icon: "HeartPulse", color: "rose", type: "expense", isDefault: true, sortOrder: 6 },
  { name: "Giáo dục", icon: "GraduationCap", color: "cyan", type: "expense", isDefault: true, sortOrder: 7 },
  { name: "Khác", icon: "HelpCircle", color: "slate", type: "expense", isDefault: true, sortOrder: 99 },
  { name: "Lương", icon: "Wallet", color: "emerald", type: "income", isDefault: true, sortOrder: 1 },
  { name: "Thưởng", icon: "Gift", color: "green", type: "income", isDefault: true, sortOrder: 2 },
  { name: "Đầu tư", icon: "TrendingUp", color: "teal", type: "income", isDefault: true, sortOrder: 3 },
  { name: "Thu nhập khác", icon: "CircleDollarSign", color: "lime", type: "income", isDefault: true, sortOrder: 99 },
];

export const getDefaultCategoriesByType = (type: TransactionType): CategoryConfig[] =>
  DEFAULT_CATEGORIES.filter((c) => c.type === type).sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
