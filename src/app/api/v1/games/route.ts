import { NextResponse } from "next/server";
import { createSupabaseAnon } from "@/lib/db/supabase-anon";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * PUBLIC GAMES API
 *
 * Returns the list of active games with their minimum per-player price.
 * All values come from the database — zero hardcoding per architecture rules.
 */
export async function GET(request: Request) {
  // Rate Limiting: 60/min per IP
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { allowed, retryAfterSeconds } = await checkRateLimit(`games_${ip}`, 60, 60);

  if (!allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", retry_after: retryAfterSeconds } },
      { status: 429, headers: { "Retry-After": retryAfterSeconds.toString() } }
    );
  }

  const { searchParams } = new URL(request.url);
  const activeParam = searchParams.get("active"); // "true", "false", or "all"
  const activeOnly = activeParam === null || activeParam === "true";

  const supabase = createSupabaseAnon();

  // Fetch games joined with their active pricing tiers
  let query = supabase
    .from("games")
    .select(`
      id,
      slug,
      name_en,
      name_ar,
      description_en,
      description_ar,
      hero_image_url,
      display_order,
      is_active,
      max_players,
      game_pricing(duration_minutes, price_per_player, pricing_type, ammo_count, duration_minutes_display)
    `);

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: "DATABASE_ERROR", message: "Failed to fetch games" } },
      { status: 500 }
    );
  }

  // Compute the minimum (entry-level) price per player across all pricing tiers
  const games = (data ?? []).map((game) => {
    const prices = (game.game_pricing as { price_per_player: number }[]) ?? [];
    const min_price_per_player = prices.length > 0
      ? Math.min(...prices.map((p) => Number(p.price_per_player)))
      : null;

    return {
      id: game.id,
      slug: game.slug,
      name_en: game.name_en,
      name_ar: game.name_ar,
      description_en: game.description_en,
      description_ar: game.description_ar,
      hero_image_url: game.hero_image_url,
      display_order: game.display_order,
      max_players: (game as any).max_players ?? 6,
      min_price_per_player,
      pricing: game.game_pricing
    };
  });

  return NextResponse.json(games, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    }
  });
}
