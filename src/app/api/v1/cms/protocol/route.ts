import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseService
      .from('protocol_steps')
      .select('*')
      .eq('is_active', true)
      .order('step_number', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PUBLIC_PROTOCOL_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
