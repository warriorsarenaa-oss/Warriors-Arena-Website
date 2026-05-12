import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: "Invalid date format, expected YYYY-MM-DD" }, { status: 400 });
    }

    // Use the RPC that resolves hours based on hierarchy: exact_date > day_of_week > default
    const { data, error } = await supabaseService.rpc("fn_resolve_operating_hours", {
      p_date: dateStr
    });

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      // Fallback if no result (should not happen if defaults exist)
      return NextResponse.json({
        openTime: '18:00:00',
        closeTime: '21:00:00',
        isClosed: false,
        isOverride: false
      });
    }

    return NextResponse.json({
      openTime: result.open_time,
      closeTime: result.close_time,
      isClosed: result.is_closed,
      isOverride: result.source_scope !== 'default'
    });
  } catch (error) {
    console.error("[OPERATING_HOURS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
