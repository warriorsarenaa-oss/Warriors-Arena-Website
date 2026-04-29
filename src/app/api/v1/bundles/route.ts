import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/db/supabase-anon";

/**
 * PUBLIC BUNDLES API
 * 
 * Returns available game bundles (packages).
 * Computes totals based on pricing mode (per_player vs fixed_total).
 */
export async function GET() {
  const { data, error } = await supabaseAnon
    .from("bundles")
    .select("*")
    .eq("is_active", true)
    .eq("is_visible", true)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: "DATABASE_ERROR", message: "Failed to fetch bundles" } },
      { status: 500 }
    );
  }

  // Compute total prices based on pricing mode
  const bundles = data.map((bundle) => {
    const totalPrice = bundle.pricing_mode === "per_player" 
      ? bundle.price_value * bundle.player_count 
      : bundle.price_value;

    return {
      ...bundle,
      total_price: totalPrice
    };
  });

  return NextResponse.json(bundles);
}
