import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { TransactionType } from "@/types";

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  notes: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfMonth: number | null;
  nextRunDate: string;
  active: boolean;
}

interface Row {
  id: string | number;
  type?: string;
  amount: number | string;
  category: string;
  notes?: string | null;
  frequency?: string;
  day_of_month?: number | null;
  next_run_date: string;
  active?: boolean;
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function mapRow(r: Row): RecurringTransaction {
  return {
    id: String(r.id),
    type: (r.type as TransactionType) || "expense",
    amount: Number(r.amount),
    category: r.category,
    notes: r.notes || "",
    frequency: (r.frequency as RecurringTransaction["frequency"]) || "monthly",
    dayOfMonth: r.day_of_month ?? null,
    nextRunDate: r.next_run_date,
    active: r.active !== false,
  };
}

function nextDateAfter(
  from: Date,
  frequency: RecurringTransaction["frequency"],
  dayOfMonth: number | null
) {
  const d = new Date(from);
  if (frequency === "daily") {
    d.setDate(d.getDate() + 1);
  } else if (frequency === "weekly") {
    d.setDate(d.getDate() + 7);
  } else {
    const day = dayOfMonth || d.getDate();
    d.setMonth(d.getMonth() + 1);
    d.setDate(Math.min(day, 28));
  }
  return d.toISOString().split("T")[0];
}

// GET /api/recurring
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("recurring_transactions")
      .select("*")
      .order("next_run_date", { ascending: true });

    if (error) {
      return NextResponse.json({ items: [], source: "error", error: error.message });
    }
    return NextResponse.json({ items: ((data || []) as Row[]).map(mapRow) });
  } catch (error) {
    return NextResponse.json({ items: [], error: errMsg(error) });
  }
}

// POST /api/recurring — tạo mới hoặc chạy phát sinh (action=run)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "run") {
      const today = new Date().toISOString().split("T")[0];
      const { data: due, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("active", true)
        .lte("next_run_date", today);

      // Bảng chưa tạo / chưa migration: bỏ qua im lặng
      if (error) {
        return NextResponse.json({
          success: false,
          created: 0,
          skipped: true,
          error: error.message,
        });
      }

      let created = 0;
      for (const row of (due || []) as Row[]) {
        const item = mapRow(row);
        const { error: insertErr } = await supabase.from("transactions").insert([
          {
            type: item.type,
            amount: item.amount,
            category: item.category,
            date: item.nextRunDate,
            notes: item.notes ? `[định kỳ] ${item.notes}` : "[định kỳ]",
          },
        ]);
        if (insertErr) continue;

        const next = nextDateAfter(
          new Date(item.nextRunDate),
          item.frequency,
          item.dayOfMonth
        );
        await supabase
          .from("recurring_transactions")
          .update({ next_run_date: next })
          .eq("id", item.id);
        created += 1;
      }

      return NextResponse.json({ success: true, created });
    }

    const { type, amount, category, notes, frequency, dayOfMonth, nextRunDate } =
      body;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || !category || !nextRunDate) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("recurring_transactions")
      .insert([
        {
          type: type === "income" ? "income" : "expense",
          amount: parsed,
          category: String(category).trim(),
          notes: notes ? String(notes).trim() : "",
          frequency: ["daily", "weekly", "monthly"].includes(frequency)
            ? frequency
            : "monthly",
          day_of_month: dayOfMonth ?? null,
          next_run_date: nextRunDate,
          active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(mapRow(data as Row), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: errMsg(error) }, { status: 500 });
  }
}

// DELETE /api/recurring?id=
export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Thiếu id." }, { status: 400 });
    }
    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: errMsg(error) }, { status: 500 });
  }
}
