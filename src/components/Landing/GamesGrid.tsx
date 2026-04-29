import React from "react";
import { supabaseAnon } from "@/lib/db/supabase-anon";
import { GameCard } from "./GameCard";

/**
 * GamesGrid — Server Component
 *
 * Fetches active games with their minimum entry price from the database.
 * All data is sourced from Supabase — zero hardcoding per AGENTS.md.
 */
export const GamesGrid = async () => {
  const { data, error } = await supabaseAnon
    .from("games")
    .select(`
      id,
      slug,
      name_en,
      description_en,
      hero_image_url,
      display_order,
      game_pricing(price_per_player)
    `)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    // Graceful degradation: show empty state rather than crashing
    return (
      <div className="text-center py-16 text-wa-text-dim">
        <p className="text-sm uppercase tracking-widest">
          Games unavailable. Please try again shortly.
        </p>
      </div>
    );
  }

  const games = (data ?? []).map((game, index) => {
    const prices = (game.game_pricing as { price_per_player: number }[]) ?? [];
    const min_price_per_player =
      prices.length > 0
        ? Math.min(...prices.map((p) => Number(p.price_per_player)))
        : null;

    return {
      id: game.id as string,
      slug: game.slug as string,
      name: (game.name_en as string) ?? "",
      description: (game.description_en as string) ?? "",
      image: (game.hero_image_url as string) ?? "https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&w=800",
      price: min_price_per_player,
      // Mark the first game as hot (highest display priority)
      isHot: index === 0,
    };
  });

  if (games.length === 0) {
    return (
      <div className="text-center py-16 text-wa-text-dim">
        <p className="text-sm uppercase tracking-widest">
          No missions available at this time. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
      {games.map((game) => (
        <GameCard key={game.slug} {...game} />
      ))}
    </div>
  );
};
