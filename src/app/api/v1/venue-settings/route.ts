import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

export async function GET() {
  try {
    const { data, error } = await supabaseService
      .from("venue_settings")
      .select("key, value");

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API_VENUE_SETTINGS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
