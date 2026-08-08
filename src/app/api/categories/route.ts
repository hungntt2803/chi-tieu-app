import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

// GET /api/categories  -> trả danh mục từ DB, fallback về danh mục mặc định.
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.warn("Categories fallback (DB error):", error.message);
      return NextResponse.json({ categories: DEFAULT_CATEGORIES, source: "fallback" });
    }

    return NextResponse.json({ categories: (data as CategoryRow[]).map(mapRow), source: "db" });
  } catch (error) {
    console.error("Internal Server Error in GET /api/categories:", error);
    return NextResponse.json({ categories: DEFAULT_CATEGORIES, source: "fallback" });
  }
}

// POST /api/categories  -> tạo danh mục tùy chỉnh.
export async function POST(request: NextRequest) {
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
      console.error("Supabase error inserting category:", error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(mapRow(newRow), { status: 201 });
  } catch (error) {
    console.error("Internal Server Error in POST /api/categories:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}

// DELETE /api/categories?id=id  -> chỉ xóa danh mục tùy chỉnh (không xóa mặc định).
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

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("is_default", false);

    if (error) {
      console.error("Supabase error deleting category:", error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal Server Error in DELETE /api/categories:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${errMsg(error)}` },
      { status: 500 }
    );
  }
}
