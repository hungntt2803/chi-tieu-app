import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Transaction, TransactionType } from "@/types";

const VALID_TYPES: TransactionType[] = ["income", "expense"];

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

interface TxRow {
  id: string | number;
  type?: string;
  amount: number | string;
  category: string;
  date: string;
  notes?: string | null;
  created_at?: string | null;
}

function mapRow(t: TxRow): Transaction {
  return {
    id: String(t.id),
    type: (t.type as TransactionType) || "expense",
    amount: Number(t.amount),
    category: t.category,
    date: t.date,
    notes: t.notes || "",
    createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
  };
}

// GET /api/transactions?month=YYYY-MM
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM

    if (!month) {
      return NextResponse.json(
        { error: "Query parameter 'month' is required." },
        { status: 400 }
      );
    }

    const { data: dbData, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", `${month}-01`)
      .lte("date", `${month}-31`);

    if (error) {
      console.error("Supabase error fetching transactions:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    const transactions: Transaction[] = ((dbData || []) as TxRow[]).map(mapRow);

    const expenses = transactions.filter((t) => t.type === "expense");
    const incomes = transactions.filter((t) => t.type === "income");

    const totalMonthlySpend = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalMonthlyIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

    // Thống kê chi tiêu theo danh mục (chỉ tính expense)
    const statsMap: Record<string, number> = {};
    expenses.forEach((t) => {
      statsMap[t.category] = (statsMap[t.category] || 0) + t.amount;
    });

    const categoryStats = Object.entries(statsMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          totalMonthlySpend > 0 ? Math.round((amount / totalMonthlySpend) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const sortedTransactions = [...transactions].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.createdAt - a.createdAt;
    });

    return NextResponse.json({
      transactions: sortedTransactions,
      totalMonthlySpend,
      totalMonthlyIncome,
      balance: totalMonthlyIncome - totalMonthlySpend,
      categoryStats,
    });
  } catch (error) {
    console.error("Internal Server Error in GET /api/transactions:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, category, date, notes } = body;

    const txType: TransactionType = VALID_TYPES.includes(type) ? type : "expense";

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number." },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json(
        { error: "A valid category is required." },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Transaction date is required." },
        { status: 400 }
      );
    }

    const { data: newRow, error } = await supabase
      .from("transactions")
      .insert([
        {
          type: txType,
          amount: parsedAmount,
          category: category.trim(),
          date,
          notes: notes ? notes.trim() : "",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error inserting transaction:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(mapRow(newRow), { status: 201 });
  } catch (error) {
    console.error("Internal Server Error in POST /api/transactions:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}

// PUT /api/transactions
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, amount, category, date, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required for editing." },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number." },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json(
        { error: "A valid category is required." },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Transaction date is required." },
        { status: 400 }
      );
    }

    const updatePayload: {
      amount: number;
      category: string;
      date: string;
      notes: string;
      type?: TransactionType;
    } = {
      amount: parsedAmount,
      category: category.trim(),
      date,
      notes: notes ? notes.trim() : "",
    };
    if (VALID_TYPES.includes(type)) {
      updatePayload.type = type;
    }

    const { data: updatedRow, error } = await supabase
      .from("transactions")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating transaction:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(mapRow(updatedRow));
  } catch (error) {
    console.error("Internal Server Error in PUT /api/transactions:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions?id=id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Query parameter 'id' is required for deletion." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      console.error("Supabase error deleting transaction:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error("Internal Server Error in DELETE /api/transactions:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}
