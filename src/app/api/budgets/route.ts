import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

// GET /api/budgets?month=YYYY-MM  -> danh sách hạn mức của tháng (tổng + theo danh mục)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json(
        { error: "Query parameter 'month' is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("month", month);

    if (error) {
      console.error("Supabase error fetching budgets:", error);
      return NextResponse.json({ budgets: [], overall: 0, source: "error" });
    }

    const budgets = ((data || []) as BudgetRow[]).map(mapRow);
    const overall = budgets.find((b) => b.category === null)?.amount ?? 0;

    return NextResponse.json({ budgets, overall, source: "db" });
  } catch (error) {
    console.error("Internal Server Error in GET /api/budgets:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}

// PUT /api/budgets  -> upsert hạn mức cho (month, category).
// category = null  => hạn mức tổng của tháng.
export async function PUT(request: NextRequest) {
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

    // Tìm bản ghi hiện có cho (month, category) rồi update/insert.
    let query = supabase.from("budgets").select("id").eq("month", month);
    query = cat === null ? query.is("category", null) : query.eq("category", cat);
    const { data: existing } = await query.maybeSingle();

    if (existing?.id) {
      const { data: updated, error } = await supabase
        .from("budgets")
        .update({ amount: parsedAmount, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) {
        console.error("Supabase error updating budget:", error);
        return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
      }
      return NextResponse.json(mapRow(updated));
    }

    const { data: inserted, error } = await supabase
      .from("budgets")
      .insert([{ month, category: cat, amount: parsedAmount }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error inserting budget:", error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(mapRow(inserted), { status: 201 });
  } catch (error) {
    console.error("Internal Server Error in PUT /api/budgets:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}
