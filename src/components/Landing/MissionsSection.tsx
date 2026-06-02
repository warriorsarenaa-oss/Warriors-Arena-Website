"use client";

import React, { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { Loader2 } from "lucide-react";
import { SpecialMission } from "../public/booking/StepMission";

export const MissionsSection = ({ cms }: { cms?: any }) => {
  const t = useTranslations("Landing");
  const locale = useLocale();
  const [missions, setMissions] = useState<SpecialMission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMissions() {
      try {
        const res = await fetch("/api/v1/missions");
        if (res.ok) {
          const data = await res.json();
          setMissions(data);
        }
      } catch (err) {
        console.error("Failed to fetch missions for landing page:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMissions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-wa-green animate-spin" />
      </div>
    );
  }

  if (missions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {missions.map((mission) => {
        const name = locale === "ar" ? (mission.name_ar || mission.name_en) : mission.name_en;
        const description = locale === "ar" ? (mission.description_ar || mission.description_en) : mission.description_en;

        return (
          <WAPanel key={mission.id} className="h-full overflow-hidden p-0 border-wa-line/30 hover:border-wa-green/50 transition-colors group">
            <div className="relative flex flex-col h-full min-h-[350px]">
              {/* Image Section - Stacks on mobile, covers on desktop */}
              <div className="relative w-full h-48 md:absolute md:inset-0 md:h-full overflow-hidden bg-wa-black shrink-0">
                {mission.image_url ? (
                  <img src={mission.image_url} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-wa-text/5">
                    <span className="text-4xl opacity-50">🎯</span>
                  </div>
                )}
                {/* Gradient overlay for desktop (where text is over image) */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              </div>
              
              {/* Content Section */}
              <div className="relative p-6 md:p-8 flex flex-col h-full justify-end z-10 bg-wa-bg md:bg-transparent flex-grow">
                <div>
                  <h3 className="text-2xl font-archivo text-wa-green uppercase mb-3 md:drop-shadow-lg">
                    {name}
                  </h3>
                  <p className="text-wa-text/80 font-barlow leading-relaxed md:drop-shadow-md">
                    {description}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-wa-line/20 md:border-wa-text/20 flex justify-between items-center">
                  <span className="text-sm font-archivo text-wa-text md:text-white uppercase tracking-wider font-bold">
                    +{mission.additional_price_per_player} <span className="text-[10px]">EGP</span> / Player
                  </span>
                  <span className="text-[10px] font-mono text-wa-green uppercase tracking-tighter bg-wa-green/10 px-2 py-1 rounded">
                    {cms?.addon_badge || "Add-on Mission"}
                  </span>
                </div>
              </div>
            </div>
          </WAPanel>
        );
      })}
    </div>
  );
};
