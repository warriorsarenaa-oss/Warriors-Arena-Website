"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";

export const ParkNotice: React.FC = () => {
  const t = useTranslations("Landing.ParkNotice");

  return (
    <div
      className="wa-panel border p-7 flex items-center gap-5"
      style={{
        borderColor: "rgba(255,122,26,0.3)",
        background: "linear-gradient(90deg, rgba(255,122,26,0.06), transparent)",
      }}
    >
      <div className="w-12 h-12 shrink-0 border border-wa-orange flex items-center justify-center text-wa-orange">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <div>
        <div className="font-mono text-[11px] text-wa-orange tracking-[0.2em] uppercase mb-1">
          {t("heading")}
        </div>
        <p className="text-[15px] text-wa-text leading-relaxed">
          {t("body")}
        </p>
      </div>
    </div>
  );
};
