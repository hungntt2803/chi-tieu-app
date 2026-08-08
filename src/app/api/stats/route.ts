import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-guard";
import { shiftMonth } from "@/lib/format";

interface TxRow {
  type?: string;
  amount: number | string;
  category: string;
  date: string;
}

function summarize(rows: TxRow[]) {
  let income = 0;
  let expense = 0;
  const byCategory: Record<string, number> = {};
  for (const t of rows) {
    const amount = Number(t.amount);
    if (t.type === "income") income += amount;
    else {
      expense += amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + amount;
    }
  }
  return { income, expense, balance: income - expense, byCategory };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  try {
    const month = new URL(request.url).searchParams.get("month");
    if (!month) {
      return NextResponse.json(
        { error: "Query parameter 'month' is required." },
        { status: 400 }
      );
    }

    const prevMonth = shiftMonth(month, -1);
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) months.push(shiftMonth(month, -i));

    const fetchMonth = async (m: string) => {
      const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, category, date")
        .eq("user_id", user.id)
        .gte("date", `${m}-01`)
        .lte("date", `${m}-31`);
      if (error) throw error;
      return (data || []) as TxRow[];
    };

    const [currentRows, prevRows, ...trendRows] = await Promise.all([
      fetchMonth(month),
      fetchMonth(prevMonth),
      ...months.map(fetchMonth),
    ]);

    const current = summarize(currentRows);
    const previous = summarize(prevRows);

    const categoryStats = Object.entries(current.byCategory)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          current.expense > 0
            ? Math.round((amount / current.expense) * 100)
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const trend = months.map((m, idx) => {
      const s = summarize(trendRows[idx]);
      return {
        month: m,
        income: s.income,
        expense: s.expense,
        balance: s.balance,
      };
    });

    return NextResponse.json({
      current: {
        income: current.income,
        expense: current.expense,
        balance: current.balance,
      },
      previous: {
        income: previous.income,
        expense: previous.expense,
        balance: previous.balance,
      },
      categoryStats,
      trend,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Database error: ${msg}` }, { status: 500 });
  }
}
