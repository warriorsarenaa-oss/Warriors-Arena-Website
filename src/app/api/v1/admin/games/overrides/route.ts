import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseService
      .from("game_date_overrides")
      .select(`
        *,
        games (name_en)
      `)
      .order("override_date", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json(); // { game_id, override_date, is_available, reason }
  if (body.allowed_times && body.allowed_times.length === 0) body.allowed_times = null;

  try {
    const { data, error } = await supabaseService
      .from("game_date_overrides")
      .upsert(body, { onConflict: "game_id,override_date" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
