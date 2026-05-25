import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

// GET availability for a specific game
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabaseService
      .from("game_day_availability")
      .select("*")
      .eq("game_id", id)
      .order("day_of_week", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

// POST update availability for a specific game
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json(); // Array of { day_of_week, is_available }

  try {
    const { error } = await supabaseService
      .from("game_day_availability")
      .upsert(
        body.map((item: any) => ({
          game_id: id,
          day_of_week: item.day_of_week,
          is_available: item.is_available,
          allowed_times: item.allowed_times || null
        })),
        { onConflict: "game_id,day_of_week" }
      );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
