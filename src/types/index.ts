export type TransactionType = 'income' | 'expense';

// Danh mục là chuỗi động (đọc từ DB). Giữ union cũ làm gợi ý cho danh mục mặc định.
export type DefaultExpenseCategory =
  | 'Ăn uống'
  | 'Di chuyển'
  | 'Mua sắm'
  | 'Hoá đơn'
  | 'Giải trí'
  | 'Sức khỏe'
  | 'Giáo dục'
  | 'Khác';

export type Category = string;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  date: string; // Format: YYYY-MM-DD
  notes: string;
  createdAt: number; // timestamp
}

export interface CategoryConfig {
  id?: string;
  name: string;
  icon: string; // Tên icon lucide-react
  color: string; // Khóa màu trong bảng màu app
  type: TransactionType;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface Budget {
  id?: string;
  month: string; // 'YYYY-MM'
  category: string | null; // null = hạn mức tổng của tháng
  amount: number;
}

export interface CategoryStat {
  name: Category;
  amount: number;
  percentage: number;
}
