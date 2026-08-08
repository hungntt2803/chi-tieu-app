export const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

export const formatCompactVND = (amount: number) => {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}k`;
  }
  return amount.toLocaleString("vi-VN");
};

export const getVietnameseDateString = (dateStr: string) => {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = dateObj.toDateString() === today.toDateString();
  const isYesterday = dateObj.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Hôm nay, ${dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`;
  }
  if (isYesterday) {
    return `Hôm qua, ${dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`;
  }

  return dateObj.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const getMonthLabel = (monthStr: string) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  return `Tháng ${month}/${year}`;
};

export const getMonthOptions = (count = 12) => {
  const options: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    options.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return options;
};

export const shiftMonth = (monthStr: string, delta: number) => {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const percentChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
};
