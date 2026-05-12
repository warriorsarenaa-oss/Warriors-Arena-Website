import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseService
      .from('gallery_images')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PUBLIC_GALLERY_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
