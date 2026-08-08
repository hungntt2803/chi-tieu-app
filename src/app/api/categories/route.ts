import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-guard";
import { CategoryConfig, TransactionType } from "@/types";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

const VALID_TYPES: TransactionType[] = ["income", "expense"];
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

interface CategoryRow {
  id: string | number;
  name: string;
  icon?: string | null;
  color?: string | null;
  type?: string;
  is_default?: boolean;
  sort_order?: number | null;
}

function mapRow(c: CategoryRow): CategoryConfig {
  return {
    id: String(c.id),
    name: c.name,
    icon: c.icon || "HelpCircle",
    color: c.color || "slate",
    type: (c.type as TransactionType) || "expense",
    isDefault: !!c.is_default,
    sortOrder: c.sort_order ?? 0,
  };
}

export async function GET() {
  const auth = await requireUser();
  if (auth.error) {
    // Chưa login: vẫn trả danh mục mặc định cho UI login/fallback
    return NextResponse.json({ categories: DEFAULT_CATEGORIES, source: "fallback" });
  }
  const { supabase } = auth;

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ categories: DEFAULT_CATEGORIES, source: "fallback" });
    }

    return NextResponse.json({
      categories: (data as CategoryRow[]).map(mapRow),
      source: "db",
    });
  } catch {
    return NextResponse.json({ categories: DEFAULT_CATEGORIES, source: "fallback" });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  try {
    const body = await request.json();
    const { name, icon, color, type } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Tên danh mục là bắt buộc." }, { status: 400 });
    }

    const txType: TransactionType = VALID_TYPES.includes(type) ? type : "expense";

    const { data: newRow, error } = await supabase
      .from("categories")
      .insert([
        {
          user_id: user.id,
          name: name.trim(),
          icon: icon || "HelpCircle",
          color: color || "slate",
          type: txType,
          is_default: false,
          sort_order: 50,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(mapRow(newRow as CategoryRow), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Query parameter 'id' is required for deletion." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_default", false);

    if (error) {
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}
