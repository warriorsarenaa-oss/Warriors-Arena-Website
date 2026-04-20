import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  // 1. Validate CRON_SECRET header
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Call the Supabase RPC
  // This RPC flips 'confirmed' bookings to 'completed' if the time has passed
  const { data, error } = await supabaseService.rpc("fn_complete_bookings_due");

  if (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Return count
  return NextResponse.json({
    status: "ok",
    processed: data || 0,
    timestamp: new Date().toISOString(),
  });
}
