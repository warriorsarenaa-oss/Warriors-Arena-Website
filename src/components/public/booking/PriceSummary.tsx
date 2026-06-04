import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatNumber } from "@/lib/i18n/formatters";
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
  const locale = useLocale();
  const { settings } = useVenueSettings();

  const total = playerCount * (pricePerPlayer + missionPricePerPlayer);
  
  if (compact) {
    return (
      <div className="bg-wa-bg/95 backdrop-blur-md border-t border-wa-green/30 p-3 sm:p-4 flex justify-between items-center w-full">
        <div className="flex flex-col">
          <span className="text-[9px] text-wa-text/40 font-mono uppercase tracking-tighter">
            {gameName || "—"} · {pricingType === 'ammo' ? `${formatNumber(ammoCount || 0, locale)} ${locale === 'ar' ? 'طلقة' : 'BULLETS'}` : `${duration ? formatNumber(duration, locale) : "—"} ${locale === 'ar' ? 'دقيقة' : 'MIN'}`}
          </span>
          <span className="text-xs sm:text-sm font-archivo text-wa-text uppercase truncate max-w-[200px]">
            {formatNumber(playerCount, locale)} {t("players")} {missionName && `+ ${missionName}`}
          </span>
        </div>
        <div className="text-end">
          <div className="text-[10px] text-wa-text/40 font-mono uppercase">{t("total")}</div>
          <div className="text-base sm:text-lg font-archivo text-wa-green leading-none">
            {formatNumber(total, locale)} <small className="text-[10px]">EGP</small>
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
            <span className="text-wa-text font-archivo text-end">{gameName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-wa-text/60 text-sm font-barlow">{pricingType === 'ammo' ? (locale === 'ar' ? 'الذخيرة' : 'AMMO') : t("duration")}</span>
            <span className="text-wa-text font-archivo">
              {pricingType === 'ammo' ? (ammoCount ? `${formatNumber(ammoCount, locale)} ${locale === 'ar' ? 'طلقة' : 'BULLETS'}` : "—") : (duration ? `${formatNumber(duration, locale)} ${locale === 'ar' ? 'دقيقة' : 'MIN'}` : "—")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-wa-text/60 text-sm font-barlow">{t("players")}</span>
            <span className="text-wa-text font-archivo">× {formatNumber(playerCount, locale)}</span>
          </div>
          {missionName && (
            <div className="flex justify-between items-start pt-2 border-t border-wa-gray/10">
              <span className="text-wa-text/60 text-sm font-barlow">{locale === 'ar' ? 'المهمة' : 'MISSION'}</span>
              <span className="text-wa-green font-archivo text-end uppercase text-xs">{missionName}</span>
            </div>
          )}
        </div>

        {/* 2. Math */}
        <div className="flex flex-col gap-4 pt-6 border-t border-dashed border-wa-gray/40">
          <div className="flex justify-between items-center">
            <span className="text-wa-text/60 text-sm font-barlow">{t("total")}</span>
            <span className="text-2xl font-archivo text-wa-green">
              {formatNumber(total, locale)} <small className="text-xs">EGP</small>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-wa-text/40 text-[10px] font-mono uppercase">
              {t("depositRequired")}
            </span>
            <span className="font-archivo text-xl text-wa-text">
              {formatNumber(total, locale)} EGP
            </span>
          </div>
        </div>
      </div>
    </WAPanel>
  );
};
