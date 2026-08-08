import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-guard";
import { Budget } from "@/types";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

interface BudgetRow {
  id: string | number;
  month: string;
  category?: string | null;
  amount: number | string;
}

function mapRow(b: BudgetRow): Budget {
  return {
    id: String(b.id),
    month: b.month,
    category: b.category ?? null,
    amount: Number(b.amount),
  };
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

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month);

    if (error) {
      return NextResponse.json({ budgets: [], overall: 0, source: "error" });
    }

    const budgets = ((data || []) as BudgetRow[]).map(mapRow);
    const overall = budgets.find((b) => b.category === null)?.amount ?? 0;
    return NextResponse.json({ budgets, overall, source: "db" });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  try {
    const body = await request.json();
    const { month, category, amount } = body;

    if (!month) {
      return NextResponse.json({ error: "Tháng là bắt buộc." }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: "Hạn mức phải là số không âm." },
        { status: 400 }
      );
    }

    const cat = category ?? null;
    let query = supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("month", month);
    query = cat === null ? query.is("category", null) : query.eq("category", cat);
    const { data: existing } = await query.maybeSingle();

    if (existing?.id) {
      const { data: updated, error } = await supabase
        .from("budgets")
        .update({ amount: parsedAmount, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) {
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }
      return NextResponse.json(mapRow(updated as BudgetRow));
    }

    const { data: inserted, error } = await supabase
      .from("budgets")
      .insert([{ user_id: user.id, month, category: cat, amount: parsedAmount }])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(mapRow(inserted as BudgetRow), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}
