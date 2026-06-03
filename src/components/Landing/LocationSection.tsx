"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "../UI/SectionHeader";

// Instagram SVG icon
function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

export const LocationSection: React.FC<{ locale?: string }> = ({ locale = "en" }) => {
  const t = useTranslations("Landing.Location");
  const [operatingHours, setOperatingHours] = useState(t("hoursValue"));
  const [contactData, setContactData] = useState<any>(null);

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

    const fetchContact = async () => {
      try {
        const res = await fetch(`/api/v1/cms/contact`);
        if (res.ok) {
          const data = await res.json();
          setContactData(data[locale] || data.en || {});
        }
      } catch (err) {
        console.error("LocationSection: Failed to fetch contact", err);
      }
    };

    fetchHours();
    fetchContact();
  }, [locale]);

  const getVal = (key: string, fallback: string) => {
    return contactData?.[key] || fallback;
  };

  const address = getVal('contact_address', t("addressValue"));
  const tagline = getVal('contact_tagline', t("locationLine", { fallback: "Get directions and comms channels." }));
  const whatsapp = getVal('contact_whatsapp', t("whatsappValue"));

  // Instagram: CMS-controlled label and URL
  const igLabel = getVal('contact_instagram_label', "Warriors Arena");
  const igUrlFromCms = getVal('contact_instagram_url', '');
  const igHandle = getVal('contact_instagram', "warriors_arenaa");
  const igUrl = igUrlFromCms || `https://www.instagram.com/${igHandle.replace('@', '')}/`;

  const mapsUrl = getVal('contact_maps_url', "https://maps.app.goo.gl/o5XEWd5AD3zWEDqr5");

  const heading = getVal('contact_heading', t("locationTitle", { fallback: "RALLY POINT" }));
  // Hours: CMS override wins over the settings-API value
  const hoursDisplay = getVal('contact_hours_display', operatingHours);
  const lblAddress = getVal('address_label', t("addressLabel"));
  // Fallback: Arabic = "تواصل معنا", English = "CONTACT"
  const lblContact = getVal(
    'contact_label',
    locale === 'ar' ? 'تواصل معنا' : 'CONTACT'
  );
  const ctaDirections = getVal('directions_cta', t("directionsCTA"));
  const ctaWhatsapp = getVal('whatsapp_cta', t("whatsappCTA"));

  return (
    <div>
      <SectionHeader title={heading} line={tagline} />
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Address */}
          <div className="border-l-2 border-wa-green pl-5 rtl:pr-5 rtl:pl-0 rtl:border-r-2 rtl:border-l-0">
            <h3 className="font-mono text-[11px] text-wa-green tracking-[0.2em] uppercase mb-1">
              {lblAddress}
            </h3>
            <p className="text-xl text-wa-text font-archivo uppercase">
              {address}
            </p>
          </div>

          {/* Hours */}
          <div className="border-l-2 border-wa-green pl-5 rtl:pr-5 rtl:pl-0 rtl:border-r-2 rtl:border-l-0">
            <h3 className="font-mono text-[11px] text-wa-green tracking-[0.2em] uppercase mb-1">
              {t("hoursLabel")}
            </h3>
            <p className="text-xl text-wa-text font-archivo uppercase">
              {hoursDisplay}
            </p>
          </div>

          {/* Contact */}
          <div className="border-l-2 border-wa-green pl-5 rtl:pr-5 rtl:pl-0 rtl:border-r-2 rtl:border-l-0">
            <h3 className="font-mono text-[11px] text-wa-green tracking-[0.2em] uppercase mb-1">
              {lblContact}
            </h3>
            <p className="text-wa-text-dim mb-3 font-mono text-sm">
              WhatsApp: {whatsapp}
            </p>

            {/* Instagram – styled pill button */}
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-wa-green/40 text-wa-green hover:bg-wa-green/10 hover:border-wa-green transition-all duration-200 text-sm font-mono group"
              style={{ textDecoration: 'none' }}
            >
              <span className="text-[#E1306C] group-hover:text-pink-400 transition-colors">
                <InstagramIcon size={15} />
              </span>
              <span className="font-semibold tracking-wide">{igLabel}</span>
            </a>
          </div>
        </div>

        {/* CTA Buttons — native <a> tags resist ad-blocker interception */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-wa-line">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-btn wa-btn--ghost flex-1 flex items-center justify-center no-underline text-center"
          >
            <span className="relative z-10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 mr-2 rtl:ml-2 rtl:mr-0">
                <path d="M12 22s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {ctaDirections}
            </span>
          </a>

          <a
            href={`https://wa.me/${whatsapp.replace(/[\s\+]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-btn flex-1 flex items-center justify-center no-underline text-center"
          >
            <span className="relative z-10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="shrink-0 mr-2 rtl:ml-2 rtl:mr-0">
                <path d="M12 2a10 10 0 00-8.5 15.2L2 22l5-1.3A10 10 0 1012 2zm5.8 14.1c-.3.7-1.5 1.4-2.1 1.5-.5.1-1.2.1-2-.1a12 12 0 01-6.7-6.2c-.3-.6-.7-1.6-.7-2.4 0-.8.4-1.2.6-1.4.2-.2.5-.3.7-.3h.5c.2 0 .5 0 .7.5l1 2.2c.1.2.2.5 0 .7l-.4.5-.2.3c-.1.1-.2.3-.1.5a8 8 0 004 3.7c.2.1.4.1.5 0l.7-.9c.2-.3.4-.2.7-.1l2.2 1.2c.3.1.5.2.6.4 0 .3 0 1-.4 1.7z" />
              </svg>
              {ctaWhatsapp}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
