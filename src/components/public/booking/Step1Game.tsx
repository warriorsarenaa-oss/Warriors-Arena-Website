import React, { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { Loader2, Shield, Sword, Target } from "lucide-react";
import { StrategicNotice } from "@/components/UI/StrategicNotice";
import { motion, AnimatePresence } from "framer-motion";

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
  date?: string; // Optional date from draft
}

export const Step1Game: React.FC<Step1GameProps> = ({ selectedGameId, onSelect, date }) => {
  const t = useTranslations("Booking.Step1");
  const locale = useLocale();
  const [games, setGames] = useState<Game[]>([]);
  const [availableGamesIds, setAvailableGamesIds] = useState<string[]>([]);
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
        if (!date) setLoading(false);
      }
    }
    fetchGames();
  }, [date]);

  useEffect(() => {
    if (!date || games.length === 0) {
      setAvailableGamesIds(games.map(g => g.id));
      if (games.length > 0) setLoading(false);
      return;
    }

    async function fetchAvailability() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/availability/games?date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableGamesIds(data.filter((a: any) => a.is_available).map((a: any) => a.game_id));
        }
      } catch (err) {
        console.error("Failed to fetch game availability:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, [date, games]);

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
    <div className="space-y-8">
      <StrategicNotice className="mb-8" />
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {games.map((game) => {
          const isSelected = selectedGameId === game.id;
          const isAvailable = availableGamesIds.includes(game.id);
          const name = locale === "ar" ? game.name_ar : game.name_en;
          const description = locale === "ar" ? game.description_ar : game.description_en;

          if (!isAvailable) return null;

          return (
            <motion.button
              key={game.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(game)}
              className="text-left rtl:text-right group outline-none relative"
            >
              <WAPanel
                hot={isSelected}
                className={`h-full transition-all duration-300 relative overflow-hidden ${
                  isSelected ? "border-wa-green shadow-[0_0_20px_rgba(57,255,20,0.15)]" : "border-wa-text/10 hover:border-wa-text/30"
                }`}
              >
                {/* Visual Scanner on Hover/Selected */}
                {(isSelected) && (
                  <motion.div 
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-wa-green/5 to-transparent pointer-events-none skew-x-[-20deg]"
                  />
                )}

                <div className="p-6 flex flex-col h-full gap-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 bg-wa-text/5 border transition-colors ${
                      isSelected ? "border-wa-green text-wa-green" : "border-wa-text/10 text-wa-text/40 group-hover:border-wa-text/20 group-hover:text-wa-text"
                    }`}>
                      {game.slug.includes("laser") ? <Shield className="w-6 h-6" /> : <Sword className="w-6 h-6" />}
                    </div>
                    {isSelected && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-wa-green uppercase tracking-[0.2em] animate-pulse">
                          {t("selected")}
                        </span>
                        <Target className="w-4 h-4 text-wa-green mt-1" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className={`text-2xl font-archivo uppercase mb-2 transition-colors ${
                      isSelected ? "text-wa-green" : "text-wa-text group-hover:text-wa-green/80"
                    }`}>
                      {name}
                    </h3>
                    <p className="text-wa-text/60 font-barlow text-sm line-clamp-3 leading-relaxed">
                      {description}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-wa-gray/20 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-wa-text/40 uppercase font-mono tracking-widest">{t("startingAt")}</span>
                      <span className={`text-xl font-archivo ${isSelected ? "text-wa-green" : "text-wa-text"}`}>
                        {game.min_price_per_player} <small className="text-xs">EGP</small>
                      </span>
                    </div>
                    <div className="flex flex-col items-end group-hover:translate-x-1 transition-transform">
                      <span className="text-[9px] text-wa-text/40 uppercase font-mono tracking-widest">{t("perPlayer")}</span>
                      <span className="text-[10px] text-wa-green underline cursor-help uppercase font-bold tracking-tighter">
                        {t("viewPricing")}
                      </span>
                    </div>
                  </div>
                </div>
              </WAPanel>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
