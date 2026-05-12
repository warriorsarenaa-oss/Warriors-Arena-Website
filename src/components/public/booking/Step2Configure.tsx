"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { Users, Clock, Plus, Minus } from "lucide-react";

interface GamePricing {
  duration_minutes: number;
  price_per_player: number;
  pricing_type?: 'time' | 'ammo';
  ammo_count?: number;
  duration_minutes_display?: string;
}

interface Step2ConfigureProps {
  pricing: GamePricing[];
  duration?: number;
  playerCount: number;
  onUpdate: (updates: { duration_minutes?: 30 | 60; player_count?: number }) => void;
  disabled?: boolean;
}

export const Step2Configure: React.FC<Step2ConfigureProps> = ({
  pricing,
  duration,
  playerCount,
  onUpdate,
  disabled = false,
}) => {
  const t = useTranslations("Booking.Step2");

  const handleIncrement = () => {
    if (disabled) return;
    if (playerCount < 6) {
      onUpdate({ player_count: playerCount + 1 });
    }
  };

  const handleDecrement = () => {
    if (disabled) return;
    if (playerCount > 1) {
      onUpdate({ player_count: playerCount - 1 });
    }
  };

  return (
    <div className={`flex flex-col gap-10 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* 1. Duration Selection */}
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-wa-text font-archivo text-xl uppercase">
          <Clock className="w-5 h-5 text-wa-green" />
          {t("chooseDuration")}
        </label>
        <div className="grid grid-cols-2 gap-4">
          {(pricing || []).map((p) => {
            const isSelected = duration === p.duration_minutes;
            return (
              <button
                key={p.duration_minutes}
                onClick={() => onUpdate({ duration_minutes: p.duration_minutes as 30 | 60 })}
                className="outline-none"
                disabled={disabled}
              >
                <WAPanel
                  hot={isSelected}
                  className={`p-6 transition-all duration-200 ${
                    isSelected ? "bg-wa-green/5 border-wa-green" : "hover:border-wa-text/20"
                  }`}
                  withBrackets={false}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-2xl font-archivo ${isSelected ? "text-wa-green" : "text-wa-text"}`}>
                      {p.pricing_type === 'ammo' ? (
                        `${p.ammo_count} ${t("bullets")}`
                      ) : (
                        `${p.duration_minutes} ${t("min")}`
                      )}
                    </span>
                    <span className="text-[10px] text-wa-text/40 font-mono uppercase tracking-widest text-center">
                      {p.price_per_player} EGP / {t("player")}
                      {p.pricing_type === 'ammo' && p.duration_minutes_display && (
                        <> · {p.duration_minutes_display}</>
                      )}
                    </span>
                  </div>
                </WAPanel>
              </button>
            );
          })}
          {disabled && pricing?.length === 0 && (
             <div className="col-span-2">
                <WAPanel hot className="p-6 text-center">
                   <span className="text-2xl font-archivo text-wa-green">
                      {duration} {t("min")}
                   </span>
                </WAPanel>
             </div>
          )}
        </div>
      </div>

      {/* 2. Player Count Stepper */}
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-wa-text font-archivo text-xl uppercase">
          <Users className="w-5 h-5 text-wa-green" />
          {t("playerCount")}
        </label>
        <div className="flex items-center gap-6">
          <button
            onClick={handleDecrement}
            disabled={disabled || playerCount <= 1}
            className="w-12 h-12 flex items-center justify-center border-2 border-wa-text/20 text-wa-text hover:border-wa-green hover:text-wa-green disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center min-w-[60px]">
            <span className="text-5xl font-archivo text-wa-text leading-none">
              {playerCount}
            </span>
            <span className="text-[10px] text-wa-text/40 font-mono uppercase mt-2">
              {t("players")}
            </span>
          </div>

          <button
            onClick={handleIncrement}
            disabled={disabled || playerCount >= 6}
            className="w-12 h-12 flex items-center justify-center border-2 border-wa-text/20 text-wa-text hover:border-wa-green hover:text-wa-green disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>

          <div className="ml-auto text-right rtl:mr-auto rtl:text-left">
            <p className="text-[10px] text-wa-text/40 font-mono uppercase tracking-widest">
              {disabled ? "Fixed for this offer" : t("maxPlayersNote", { max: 6 })}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
