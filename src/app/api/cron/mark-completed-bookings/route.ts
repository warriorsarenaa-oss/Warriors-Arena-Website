import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { env } from "@/lib/env";
import { logger } from "@/lib/log";

/**
 * CRON JOB: MARK COMPLETED BOOKINGS
 * 
 * Invoked by Vercel Cron or similar scheduler.
 * Updates bookings that have finished their duration to 'completed' status.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");

  // 1. Verify Authorization
  if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Execute RPC
    // fn_complete_bookings_due() returns integer (count of updated rows)
    const { data: count, error } = await supabaseService.rpc("fn_complete_bookings_due");

    if (error) {
      logger.error("Cron failed: fn_complete_bookings_due", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info("Cron completed: mark-completed-bookings", { count });

    return NextResponse.json({
      success: true,
      count_completed: count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error("Internal failure in Cron route", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
