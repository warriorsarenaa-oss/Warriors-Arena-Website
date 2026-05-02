"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { WAButton } from "../UI/WAButton";
import { SectionHeader } from "../UI/SectionHeader";

export const LocationSection: React.FC<{ locale?: string }> = ({ locale = "en" }) => {
  const t = useTranslations("Landing.Location");
  const [operatingHours, setOperatingHours] = useState(t("hoursValue"));

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await fetch('/api/v1/operating-hours/display');
        const data = await res.json();
        if (data.displayText) setOperatingHours(data.displayText);
      } catch (err) {
        console.error("LocationSection: Failed to fetch hours", err);
      }
    };
    fetchHours();
  }, []);

  return (
    <div>
      <SectionHeader title={t("locationTitle", { fallback: "RALLY POINT" })} line={t("locationLine", { fallback: "Get directions and comms channels." })} />
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Address */}
          <div className="border-l-2 border-wa-green pl-5 rtl:pr-5 rtl:pl-0 rtl:border-r-2 rtl:border-l-0">
            <h3 className="font-mono text-[11px] text-wa-green tracking-[0.2em] uppercase mb-1">
              {t("addressLabel")}
            </h3>
            <p className="text-xl text-wa-text font-archivo uppercase">
              {t("addressValue")}
            </p>
          </div>

          {/* Hours */}
          <div className="border-l-2 border-wa-green pl-5 rtl:pr-5 rtl:pl-0 rtl:border-r-2 rtl:border-l-0">
            <h3 className="font-mono text-[11px] text-wa-green tracking-[0.2em] uppercase mb-1">
              {t("hoursLabel")}
            </h3>
            <p className="text-xl text-wa-text font-archivo uppercase">
              {operatingHours}
            </p>
          </div>

          {/* Contact */}
          <div className="border-l-2 border-wa-green pl-5 rtl:pr-5 rtl:pl-0 rtl:border-r-2 rtl:border-l-0">
            <h3 className="font-mono text-[11px] text-wa-green tracking-[0.2em] uppercase mb-1">
              CONTACT
            </h3>
            <p className="text-wa-text-dim mb-1 font-mono text-sm">
              WhatsApp: {t("whatsappValue")}
            </p>
            <div className="flex items-center gap-2 text-wa-text-dim">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <a 
                href="https://www.instagram.com/warriors_arenaa/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm hover:text-wa-green transition-colors"
              >
                @warriors_arenaa
              </a>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-wa-line">
          <WAButton
            variant="ghost"
            type="button"
            className="flex-1"
            onClick={() => window.open("https://maps.app.goo.gl/o5XEWd5AD3zWEDqr5", "_blank")}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 mr-2 rtl:ml-2 rtl:mr-0">
              <path d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {t("directionsCTA")}
          </WAButton>
          
          <WAButton
            variant="primary"
            type="button"
            className="flex-1"
            onClick={() => window.open("https://wa.me/201226557592", "_blank")}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="shrink-0 mr-2 rtl:ml-2 rtl:mr-0">
              <path d="M12 2a10 10 0 00-8.5 15.2L2 22l5-1.3A10 10 0 1012 2zm5.8 14.1c-.3.7-1.5 1.4-2.1 1.5-.5.1-1.2.1-2-.1a12 12 0 01-6.7-6.2c-.3-.6-.7-1.6-.7-2.4 0-.8.4-1.2.6-1.4.2-.2.5-.3.7-.3h.5c.2 0 .5 0 .7.5l1 2.2c.1.2.2.5 0 .7l-.4.5-.2.3c-.1.1-.2.3-.1.5a8 8 0 004 3.7c.2.1.4.1.5 0l.7-.9c.2-.3.4-.2.7-.1l2.2 1.2c.3.1.5.2.6.4 0 .3 0 1-.4 1.7z" />
            </svg>
            {t("whatsappCTA")}
          </WAButton>
        </div>
      </div>
    </div>
  );
};
