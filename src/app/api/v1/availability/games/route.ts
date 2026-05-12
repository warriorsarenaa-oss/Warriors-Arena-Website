import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { parseISO, isValid, getDay } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
  }

  const requestedDate = parseISO(dateStr);
  if (!isValid(requestedDate)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const dayOfWeek = getDay(requestedDate); // 0=Sun, 1=Mon, etc.

  try {
    // 1. Fetch all active games
    const { data: games, error: gamesError } = await supabaseService
      .from("games")
      .select("id, name_en, name_ar, slug")
      .eq("is_active", true);

    if (gamesError) throw gamesError;

    // 2. Fetch day-of-week availability for this day
    const { data: dayAvailability, error: dayError } = await supabaseService
      .from("game_day_availability")
      .select("game_id, is_available")
      .eq("day_of_week", dayOfWeek);

    if (dayError) throw dayError;

    // 3. Fetch date-specific overrides for this date
    const { data: overrides, error: overrideError } = await supabaseService
      .from("game_date_overrides")
      .select("game_id, is_available")
      .eq("override_date", dateStr);

    if (overrideError) throw overrideError;

    // 4. Combine logic
    const availability = games.map(game => {
      const dayConfig = dayAvailability?.find(d => d.game_id === game.id);
      const override = overrides?.find(o => o.game_id === game.id);

      let isAvailable = true; // Default

      // Override takes precedence
      if (override) {
        isAvailable = override.is_available;
      } else if (dayConfig) {
        // Then day-of-week config
        isAvailable = dayConfig.is_available;
      }

      return {
        game_id: game.id,
        game_name_en: game.name_en,
        game_name_ar: game.name_ar,
        slug: game.slug,
        is_available: isAvailable
      };
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("[api/availability/games] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
