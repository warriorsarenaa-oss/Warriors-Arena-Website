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
        <Link href={`/${locale}`} className="flex items-center gap-4 no-underline group">
          <div
            className="w-12 h-12 border border-wa-green/30 p-1 bg-wa-bg/50 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500"
            style={{ clipPath: "polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)" }}
          >
            <img 
              src="/logo.jpg" 
              alt="Warriors Arena" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="leading-none flex flex-col">
            <span className="font-archivo text-[18px] text-wa-text uppercase tracking-wider">WARRIORS</span>
            <span className="font-mono text-[10px] text-wa-green tracking-[0.3em]">ARENA · EGY</span>
          </div>
        </Link>

        {/* Tagline */}
        <div className="font-mono text-[11px] text-wa-text-mute tracking-[0.15em] text-center">
          {t("copyright")} &nbsp;·&nbsp; {t("tagline")}
        </div>

      </div>
    </footer>
  );
};
