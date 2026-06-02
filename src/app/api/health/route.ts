import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { env } from "@/lib/env";

/**
 * SYSTEM HEALTH CHECK
 * 
 * Verifies that:
 * 1. Environment variables are loaded and validated correctly.
 * 2. Database connectivity is functional and low-latency.
 * 
 * This endpoint is used by uptime monitors and deployment probes.
 */
export async function GET() {
  const start = Date.now();
  
  try {
    // 1. Check Env (the import already validates, so we just check access)
    const siteUrl = env.NEXT_PUBLIC_SITE_URL;

    // 2. Check Database connection with a simple SELECT 1
    const { error: dbError } = await supabaseService.from("games").select("count").limit(1);

    if (dbError) {
      throw new Error(`Database connectivity issue: ${dbError.message}`);
    }

    const latency = Date.now() - start;

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      supabase_latency_ms: latency,
      site_url: siteUrl,
      environment: process.env.NODE_ENV
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({
      ok: false,
      error: message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
