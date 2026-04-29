"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export const Footer: React.FC = () => {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("Landing.Footer");

  return (
    <footer className="border-t border-wa-line py-10 px-6 bg-[#080a08]">
      <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row justify-between items-center gap-5 flex-wrap">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5 no-underline">
          <div
            className="w-9 h-9 bg-wa-green flex items-center justify-center text-wa-bg"
            style={{ clipPath: "polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)" }}
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div className="leading-none flex flex-col">
            <span className="font-archivo text-[18px] text-wa-text uppercase">WARRIORS</span>
            <span className="font-mono text-[10px] text-wa-green tracking-[0.3em]">ARENA · EGY</span>
          </div>
        </Link>

        {/* Tagline */}
        <div className="font-mono text-[11px] text-wa-text-mute tracking-[0.15em] text-center">
          {t("copyright")} &nbsp;·&nbsp; {t("tagline")}
        </div>

        {/* Links */}
        <div className="flex gap-6">
          <a href="#" className="font-mono text-[12px] text-wa-text-dim hover:text-wa-green transition-colors no-underline">
            {t("privacy")}
          </a>
          <a href="#" className="font-mono text-[12px] text-wa-text-dim hover:text-wa-green transition-colors no-underline">
            {t("terms")}
          </a>
        </div>
      </div>
    </footer>
  );
};
