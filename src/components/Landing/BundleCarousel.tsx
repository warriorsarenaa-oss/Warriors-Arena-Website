import React from "react";
import { supabaseAnon } from "@/lib/db/supabase-anon";
import { WAPanel } from "../UI/WAPanel";
import { ShieldCheck, Zap } from "lucide-react";
import { BundleBookButton } from "./BundleBookButton";

/**
 * BundleCarousel — Server Component
 *
 * Fetches active, visible bundles with landing placement from the database.
 * All pricing and titles come from Supabase — zero hardcoding per AGENTS.md.
 */
export const BundleCarousel = async () => {
  const { data, error } = await supabaseAnon
    .from("bundles")
    .select(
      "id, slug, title_en, description_en, price_value, currency, pricing_mode, player_count, duration_minutes, display_placement, display_order"
    )
    .eq("is_visible", true)
    .eq("is_active", true)
    .in("display_placement", ["landing_featured", "landing_secondary"])
    .order("display_order", { ascending: true })
    .limit(6);

  if (error || !data || data.length === 0) {
    return (
      <div className="text-center py-16 text-wa-text-dim">
        <p className="text-sm uppercase tracking-widest">
          Bundle offers unavailable. Please try again shortly.
        </p>
      </div>
    );
  }

  // Icon roster — decorative UI chrome, assigned by display order
  const icons = [
    <ShieldCheck key="shield" className="w-8 h-8" />,
    <Zap key="zap" className="w-8 h-8" />,
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {data.map((bundle, index) => {
        const isFeatured = bundle.display_placement === "landing_featured";
        const accentColor = isFeatured ? "wa-green" : "wa-orange";

        // Compute display price label
        const priceLabel =
          bundle.pricing_mode === "per_player"
            ? `${bundle.price_value} ${bundle.currency} / player`
            : `${bundle.price_value} ${bundle.currency}`;

        return (
          <WAPanel
            key={bundle.id as string}
            className={`p-8 relative overflow-hidden${
              isFeatured ? "" : " border-wa-orange/40"
            }`}
            hot={isFeatured}
          >
            <div
              className={`absolute -top-10 -right-10 w-32 h-32 bg-${accentColor}/10 rounded-full blur-[80px]`}
            />

            <div className="flex justify-between items-start mb-8">
              <div>
                {isFeatured ? (
                  <span className="wa-tag text-[9px] mb-2 block">
                    Featured Pack
                  </span>
                ) : (
                  <span className="wa-tape wa-tape--orange text-[9px] mb-2 px-2 py-1 inline-block">
                    Most Popular
                  </span>
                )}
                <h3 className="text-4xl font-archivo text-white uppercase mt-2">
                  {(bundle.title_en as string) ?? ""}
                </h3>
              </div>

              <div
                className={`bg-${accentColor}/10 p-4 border border-${accentColor}/20 text-${accentColor}`}
              >
                {icons[index] ?? icons[0]}
              </div>
            </div>

            {bundle.description_en && (
              <p className="text-sm text-wa-text tracking-wide leading-relaxed mb-12">
                {bundle.description_en as string}
              </p>
            )}

            <div className="flex items-end justify-between pt-8 border-t border-wa-line">
              <div>
                <div className="text-sm font-mono text-wa-text-dim uppercase mb-1">
                  Total Unit Price
                </div>
                <div className="text-4xl font-archivo text-white">
                  {String(bundle.price_value)}{" "}
                  <span className="text-sm text-wa-text-dim">
                    {bundle.currency as string}
                  </span>
                </div>
                {bundle.pricing_mode === "per_player" && (
                  <div className="text-xs text-wa-text-dim mt-1">
                    per player · {bundle.player_count} players ·{" "}
                    {bundle.duration_minutes} min
                  </div>
                )}
              </div>
              <BundleBookButton
                bundleId={bundle.id as string}
                variant={isFeatured ? "primary" : "orange"}
              />
            </div>
          </WAPanel>
        );
      })}
    </div>
  );
};
