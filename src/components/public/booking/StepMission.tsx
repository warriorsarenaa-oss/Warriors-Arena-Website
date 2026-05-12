"use client";

import React, { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { Loader2, Target, CheckCircle2 } from "lucide-react";

export interface SpecialMission {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  image_url: string;
  additional_price_per_player: number;
}

interface StepMissionProps {
  gameId: string;
  selectedMissionId?: string;
  onSelect: (mission: SpecialMission | null) => void;
  onNext: () => void;
}

export const StepMission: React.FC<StepMissionProps> = ({
  gameId,
  selectedMissionId,
  onSelect,
  onNext
}) => {
  const t = useTranslations("Booking.StepMission");
  const locale = useLocale();
  const [missions, setMissions] = useState<SpecialMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMissions() {
      try {
        const res = await fetch(`/api/v1/missions?game_id=${gameId}`);
        if (!res.ok) throw new Error("Failed to fetch missions");
        const data = await res.json();
        setMissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading missions");
      } finally {
        setLoading(false);
      }
    }
    fetchMissions();
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-wa-green animate-spin" />
        <p className="text-wa-text/40 font-mono text-sm uppercase animate-pulse">
          {t("loadingMissions")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Standard Game Option (No Mission) */}
        <button
          onClick={() => {
            onSelect(null);
            onNext();
          }}
          className="text-left rtl:text-right group outline-none"
        >
          <WAPanel
            hot={!selectedMissionId}
            className={`h-full transition-all duration-300 ${
              !selectedMissionId ? "translate-y-[-4px]" : "hover:border-wa-text/20"
            }`}
          >
            <div className="p-6 flex flex-col h-full gap-4">
              <div className="flex justify-between items-start">
                <div className={`p-3 bg-wa-text/5 border ${!selectedMissionId ? "border-wa-green text-wa-green" : "border-wa-text/10 text-wa-text/40"}`}>
                  <Target className="w-6 h-6" />
                </div>
                {!selectedMissionId && (
                  <CheckCircle2 className="w-5 h-5 text-wa-green" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-archivo text-wa-text uppercase mb-2">
                  {t("noMission")}
                </h3>
                <p className="text-wa-text/60 font-barlow text-sm">
                  {t("noMissionDesc")}
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-wa-gray/20">
                <span className="text-sm font-archivo text-wa-text uppercase">
                  {t("standardPricing")}
                </span>
              </div>
            </div>
          </WAPanel>
        </button>

        {/* Dynamic Missions */}
        {missions.map((mission) => {
          const isSelected = selectedMissionId === mission.id;
          const name = locale === "ar" ? (mission.name_ar || mission.name_en) : mission.name_en;
          const description = locale === "ar" ? (mission.description_ar || mission.description_en) : mission.description_en;

          return (
            <button
              key={mission.id}
              onClick={() => {
                onSelect(mission);
                onNext();
              }}
              className="text-left rtl:text-right group outline-none"
            >
              <WAPanel
                hot={isSelected}
                className={`h-full transition-all duration-300 ${
                  isSelected ? "translate-y-[-4px]" : "hover:border-wa-text/20"
                }`}
              >
                <div className="p-6 flex flex-col h-full gap-4">
                  <div className="flex justify-between items-start">
                    <div className={`w-16 h-16 bg-wa-text/5 border rounded overflow-hidden flex items-center justify-center ${isSelected ? "border-wa-green text-wa-green" : "border-wa-text/10 text-wa-text/40"}`}>
                      {mission.image_url ? (
                        <img src={mission.image_url} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <Target className="w-6 h-6" />
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-wa-green" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-archivo text-wa-text uppercase mb-2 group-hover:text-wa-green transition-colors">
                      {name}
                    </h3>
                    <p className="text-wa-text/60 font-barlow text-sm line-clamp-2">
                      {description}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-wa-gray/20 flex justify-between items-center">
                    <span className="text-sm font-archivo text-wa-text">
                      +{mission.additional_price_per_player} <small className="text-[10px]">EGP</small> / {t("player")}
                    </span>
                    <span className="text-[10px] font-mono text-wa-green uppercase">
                      {t("missionAddon")}
                    </span>
                  </div>
                </div>
              </WAPanel>
            </button>
          );
        })}
      </div>
    </div>
  );
};
