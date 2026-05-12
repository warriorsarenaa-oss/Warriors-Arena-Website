import React from "react";
import { useTranslations } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { useVenueSettings } from "@/hooks/useVenueSettings";

interface PriceSummaryProps {
  gameName?: string;
  duration?: number;
  playerCount: number;
  pricePerPlayer?: number;
  className?: string;
  compact?: boolean;
  isBundle?: boolean;
  missionName?: string;
  missionPricePerPlayer?: number;
  pricingType?: 'time' | 'ammo';
  ammoCount?: number;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  gameName,
  duration,
  playerCount,
  pricePerPlayer = 0,
  className,
  compact = false,
  isBundle = false,
  missionName,
  missionPricePerPlayer = 0,
  pricingType = 'time',
  ammoCount,
}) => {
  const t = useTranslations("Booking.Summary");
  const { settings } = useVenueSettings();

  const total = playerCount * (pricePerPlayer + missionPricePerPlayer);
  
  if (compact) {
    return (
      <div className="bg-wa-panel border-t border-wa-green p-4 flex justify-between items-center w-full">
        <div className="flex flex-col">
          <span className="text-[10px] text-wa-text/40 font-mono uppercase tracking-tighter">
            {gameName || "—"} · {pricingType === 'ammo' ? `${ammoCount} BULLETS` : `${duration || "—"} MIN`}
          </span>
          <span className="text-sm font-archivo text-wa-text uppercase">
            {playerCount} {t("players")} {missionName && `+ ${missionName}`}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-wa-text/40 font-mono uppercase">{t("total")}</div>
          <div className="text-lg font-archivo text-wa-green leading-none">
            {total} <small className="text-[10px]">EGP</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WAPanel className={className} withClip={false} withBrackets={true}>
      <div className="flex flex-col gap-6 p-6">
        <h2 className="text-xl font-archivo uppercase text-wa-text/40 tracking-widest border-b border-wa-gray/20 pb-4">
          {t("title")}
        </h2>

        {/* 1. Selection Info */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-wa-text/60 text-sm font-barlow">{t("game")}</span>
            <span className="text-wa-text font-archivo text-right">{gameName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-wa-text/60 text-sm font-barlow">{pricingType === 'ammo' ? "AMMO" : t("duration")}</span>
            <span className="text-wa-text font-archivo">
              {pricingType === 'ammo' ? (ammoCount ? `${ammoCount} BULLETS` : "—") : (duration ? `${duration} MIN` : "—")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-wa-text/60 text-sm font-barlow">{t("players")}</span>
            <span className="text-wa-text font-archivo">× {playerCount}</span>
          </div>
          {missionName && (
            <div className="flex justify-between items-start pt-2 border-t border-wa-gray/10">
              <span className="text-wa-text/60 text-sm font-barlow">MISSION</span>
              <span className="text-wa-green font-archivo text-right uppercase text-xs">{missionName}</span>
            </div>
          )}
        </div>

        {/* 2. Math */}
        <div className="flex flex-col gap-4 pt-6 border-t border-dashed border-wa-gray/40">
          <div className="flex justify-between items-center">
            <span className="text-wa-text/60 text-sm font-barlow">{t("total")}</span>
            <span className="text-2xl font-archivo text-wa-green">
              {total} <small className="text-xs">EGP</small>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-wa-text/40 text-[10px] font-mono uppercase">
              TOTAL DUE ON ARRIVAL
            </span>
            <span className="font-archivo text-xl text-wa-text">
              {total} EGP
            </span>
          </div>
        </div>
      </div>
    </WAPanel>
  );
};
