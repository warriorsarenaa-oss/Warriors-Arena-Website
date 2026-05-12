"use client";

import React, { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { Loader2 } from "lucide-react";
import { SpecialMission } from "../public/booking/StepMission";

export const MissionsSection = () => {
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
          <WAPanel key={mission.id} className="h-full">
            <div className="p-8 flex flex-col h-full gap-6">
              <div className="w-16 h-16 bg-wa-text/5 border border-wa-text/10 flex items-center justify-center overflow-hidden">
                {mission.image_url ? (
                  <img src={mission.image_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🎯</span>
                )}
              </div>
              
              <div>
                <h3 className="text-2xl font-archivo text-wa-text uppercase mb-3">
                  {name}
                </h3>
                <p className="text-wa-text/60 font-barlow leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-wa-gray/20 flex justify-between items-center">
                <span className="text-sm font-archivo text-wa-green uppercase tracking-wider">
                  +{mission.additional_price_per_player} EGP / Player
                </span>
                <span className="text-[10px] font-mono text-wa-text/40 uppercase tracking-tighter">
                  Add-on Mission
                </span>
              </div>
            </div>
          </WAPanel>
        );
      })}
    </div>
  );
};
