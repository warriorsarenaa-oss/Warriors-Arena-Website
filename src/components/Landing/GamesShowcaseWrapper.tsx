import React from "react";
import { supabaseAnon } from "@/lib/db/supabase-anon";
import { GameShowcase } from "./GameShowcase";
import { 
  Zap, 
  Users, 
  Target, 
  ShieldCheck, 
  Activity 
} from "lucide-react";

/**
 * GamesShowcaseWrapper — Server Component
 * Fetches real game data and maps it to the Impeccable Showcase UI.
 */
export const GamesShowcaseWrapper = async ({ locale }: { locale: string }) => {
  const isRtl = locale === "ar";
  
  const { data, error } = await supabaseAnon
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
      game_pricing(price_per_player)
    `)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) {
    return (
      <div className="text-center py-16 text-wa-text-dim border border-dashed border-wa-line">
        <p className="text-sm uppercase tracking-widest">{isRtl ? "المهمات غير متصلة" : "Missions Offline"}</p>
      </div>
    );
  }

  // Map to Showcase format with rich stat generation (since DB is lean)
  const games = data.map((game, index) => {
    const prices = (game.game_pricing as { price_per_player: number }[]) ?? [];
    const minPrice = prices.length > 0 
      ? Math.min(...prices.map(p => Number(p.price_per_player))) 
      : 150;

    // Tactical stats mapping based on slug or name
    const isLaser = game.slug.toLowerCase().includes('laser');
    
    return {
      id: game.id,
      name: (isRtl ? game.name_ar : game.name_en) || "",
      description: (isRtl ? game.description_ar : game.description_en) || "",
      image: (game.hero_image_url as string) || "https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&w=800",
      price: minPrice,
      stats: {
        intensity: isLaser 
          ? (isRtl ? "حرج" : "CRITICAL") 
          : (isRtl ? "مرتفع" : "HIGH"),
        capacity: isLaser 
          ? (isRtl ? "حتى ١٢ فرد" : "UP TO 12 SQUAD") 
          : (isRtl ? "حتى ٨ أفراد" : "UP TO 8 SQUAD")
      },
      features: [
        { 
          label: isRtl ? "الكثافة" : "Intensity", 
          value: isLaser ? 92 : 84, 
          icon: "zap" 
        },
        { 
          label: isRtl ? "العمق التكتيكي" : "Tactical Depth", 
          value: isLaser ? 78 : 95, 
          icon: "target" 
        },
        { 
          label: isRtl ? "الأدرينالين" : "Adrenaline", 
          value: isLaser ? 88 : 94, 
          icon: "activity" 
        }
      ]
    };
  });

  return <GameShowcase games={games} locale={locale} />;
};
