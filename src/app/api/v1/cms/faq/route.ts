import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseService
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PUBLIC_FAQ_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
