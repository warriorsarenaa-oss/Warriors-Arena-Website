"use client";

import React, { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { Loader2, Shield, Sword } from "lucide-react";

interface GamePricing {
  duration_minutes: number;
  price_per_player: number;
}

interface Game {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  hero_image_url: string;
  min_price_per_player: number;
  pricing: GamePricing[];
}

interface Step1GameProps {
  selectedGameId?: string;
  onSelect: (game: Game) => void;
}

export const Step1Game: React.FC<Step1GameProps> = ({ selectedGameId, onSelect }) => {
  const t = useTranslations("Booking.Step1");
  const locale = useLocale();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch("/api/v1/games");
        if (!res.ok) throw new Error("Failed to fetch games");
        const data = await res.json();
        setGames(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading games");
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-wa-green animate-spin" />
        <p className="text-wa-text/40 font-mono text-sm uppercase animate-pulse">
          {t("loadingGames")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-wa-orange font-archivo text-xl uppercase mb-4">{t("error")}</p>
        <p className="text-wa-text/60">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {games.map((game) => {
        const isSelected = selectedGameId === game.id;
        const name = locale === "ar" ? game.name_ar : game.name_en;
        const description = locale === "ar" ? game.description_ar : game.description_en;

        return (
          <button
            key={game.id}
            onClick={() => onSelect(game)}
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
                  <div className={`p-3 bg-wa-text/5 border ${isSelected ? "border-wa-green text-wa-green" : "border-wa-text/10 text-wa-text/40"}`}>
                    {game.slug.includes("laser") ? <Shield className="w-6 h-6" /> : <Sword className="w-6 h-6" />}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono text-wa-green uppercase tracking-tighter animate-pulse">
                      {t("selected")}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-archivo text-wa-text uppercase mb-2 group-hover:text-wa-green transition-colors">
                    {name}
                  </h3>
                  <p className="text-wa-text/60 font-barlow text-sm line-clamp-3">
                    {description}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-wa-gray/20 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-wa-text/40 uppercase font-mono">{t("startingAt")}</span>
                    <span className="text-xl font-archivo text-wa-text">
                      {game.min_price_per_player} <small className="text-xs">EGP</small>
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-wa-text/40 uppercase font-mono">{t("perPlayer")}</span>
                    <span className="text-[10px] text-wa-green underline cursor-help">
                      {t("viewPricing")}
                    </span>
                  </div>
                </div>
              </div>
            </WAPanel>
          </button>
        );
      })}
    </div>
  );
};
