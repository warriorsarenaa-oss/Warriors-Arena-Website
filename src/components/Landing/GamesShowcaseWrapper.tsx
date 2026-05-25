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
import { SectionHeader } from "../UI/SectionHeader";

import { unstable_noStore as noStore } from 'next/cache';

/**
 * GamesShowcaseWrapper — Server Component
 * Fetches real game data and maps it to the Impeccable Showcase UI.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GamesShowcaseWrapper = async ({ locale }: { locale: string }) => {
  noStore();
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
      stat1_name,
      stat1_name_ar,
      stat1_value,
      stat2_name,
      stat2_name_ar,
      stat2_value,
      stat3_name,
      stat3_name_ar,
      stat3_value,
      max_players,
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

  // Fetch CMS for header
  let headerContent = { heading: "CHOOSE YOUR WEAPON", subheading: "Two game modes. One winner. Pick your loadout and own the arena." };
  try {
    const { data: cmsData } = await supabaseAnon.from('cms_content').select('*').eq('section', 'lineup');
    if (cmsData) {
      const headingItem = cmsData.find(item => item.key === 'heading');
      const subheadingItem = cmsData.find(item => item.key === 'subheading');
      if (headingItem) headerContent.heading = (isRtl ? headingItem.value_ar : headingItem.value_en) || headingItem.value_en;
      if (subheadingItem) headerContent.subheading = (isRtl ? subheadingItem.value_ar : subheadingItem.value_en) || subheadingItem.value_en;
    }
  } catch (err) {
    console.error("Failed to fetch lineup CMS", err);
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
        capacity: game.max_players 
          ? (isRtl ? `حتى ${game.max_players} أفراد` : `UP TO ${game.max_players} SQUAD`)
          : (isRtl ? "حتى ٨ أفراد" : "UP TO 8 SQUAD")
      },
      features: [
        { 
          label: (isRtl ? game.stat1_name_ar : game.stat1_name) as string || "", 
          value: (game.stat1_value as number) || 0, 
          icon: "zap" 
        },
        { 
          label: (isRtl ? game.stat2_name_ar : game.stat2_name) as string || "", 
          value: (game.stat2_value as number) || 0, 
          icon: "target" 
        },
        { 
          label: (isRtl ? game.stat3_name_ar : game.stat3_name) as string || "", 
          value: (game.stat3_value as number) || 0, 
          icon: "activity" 
        }
      ]
    };
  });

  return (
    <div>
      <SectionHeader 
        title={headerContent.heading} 
        line={headerContent.subheading} 
      />
      <GameShowcase games={games} locale={locale} />
    </div>
  );
};
