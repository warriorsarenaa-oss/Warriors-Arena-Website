"use client";

import React from "react";
import { WAButton } from "../UI/WAButton";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useBooking } from "@/contexts/BookingContext";

interface HeroProps {
  locale: string;
}

const MARQUEE_ITEMS = [
  "LASER TAG",
  "GEL BLASTERS",
  "LIVE ARENA",
  "HELIOPOLIS",
  "30-MIN SLOTS",
  "UP TO 6 PLAYERS",
  "OPEN NIGHTLY",
  "BIRTHDAY OPS",
];

export const Hero: React.FC<HeroProps> = ({ locale }) => {
  const t = useTranslations("Landing.Hero");
  const isRtl = locale === "ar";
  const { openWizard } = useBooking();
  const [operatingHours, setOperatingHours] = React.useState("6 PM - 9 PM");

  React.useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await fetch('/api/v1/operating-hours/display');
        const data = await res.json();
        if (data.displayText) setOperatingHours(data.displayText);
      } catch (err) {
        console.error("Hero: Failed to fetch hours", err);
      }
    };
    fetchHours();
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-wa-line bg-wa-bg wa-noise">
      {/* Animated grid */}
      <div className="absolute inset-0 wa-anim-grid opacity-100" />
      <div className="wa-scanline" />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,transparent,rgba(10,13,10,0.9)_80%)]" />

      {/* HUD corner brackets */}
      {[
        "top-4 left-4 border-t-2 border-l-2",
        "top-4 right-4 border-t-2 border-r-2",
        "bottom-16 left-4 border-b-2 border-l-2",
        "bottom-16 right-4 border-b-2 border-r-2",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-6 h-6 border-wa-green z-10 ${cls}`} />
      ))}

      {/* Main content */}
      <div className="relative z-10 max-w-[1320px] mx-auto px-6 py-16 md:py-32 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          {/* Kicker tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 flex-wrap"
          >
            <span className="wa-tag text-[11px]">
              <span className="w-2 h-2 bg-wa-green rounded-full inline-block" />
              {t("kicker")}
            </span>
            <span className="wa-tag wa-tag--neutral font-mono text-[10px]">
              {operatingHours}
            </span>
          </motion.div>

          {/* 3-line hero headline */}
          <h1 
            className={`font-archivo uppercase mt-5 ${isRtl ? "leading-[1.15]" : "leading-[0.88]"}`} 
            style={{ fontSize: "clamp(48px,10vw,150px)" }}
          >
            <motion.span
              className="block text-wa-text"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {t("line1")}
            </motion.span>
            <motion.span
              className="block text-wa-green"
              style={{ textShadow: "0 0 32px rgba(143,224,74,0.35)" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {t("line2")}
            </motion.span>
            <motion.span
              className="block"
              style={{ WebkitTextStroke: "2px var(--color-wa-green)", color: "transparent" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {t("line3")}
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p
            className="mt-7 text-lg leading-relaxed text-wa-text-dim max-w-[520px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {t("subtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-4 mt-9"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <WAButton variant="primary" size="lg" type="button" onClick={() => openWizard()}>
              {t("primaryCTA")}
            </WAButton>
            <WAButton 
              variant="ghost" 
              size="lg" 
              type="button"
              onClick={() => {
                document.getElementById('games-section')?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }}
            >
              {t("secondaryCTA")}
            </WAButton>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            className="grid grid-cols-3 gap-3 md:gap-6 mt-14 max-w-[560px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {[
              { val: t("stat1Value"), label: t("stat1Label") },
              { val: t("stat2Value"), label: t("stat2Label") },
              { val: t("stat3Value"), label: t("stat3Label") },
            ].map((s, i) => (
              <div key={i} className="border-t border-wa-line-hot pt-3">
                <div className="font-archivo text-xl md:text-2xl text-wa-green leading-none uppercase">
                  {s.val}
                </div>
                <div className="font-mono text-[9px] md:text-[11px] text-wa-text-mute tracking-[0.15em] uppercase mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: tactical card placeholder */}
        <motion.div
          className="hidden lg:block relative h-[520px]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="wa-panel border border-wa-line absolute inset-0 overflow-hidden"
            style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}>
            {/* Immersive Action Shot */}
            <img 
              src="https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&w=1200" 
              alt="Arena Tactical" 
              className="absolute inset-0 w-full h-full object-cover grayscale brightness-50"
            />
            {/* Tactical overlay grid */}
            <div className="absolute inset-0 bg-[#0a120a]/40"
              style={{
                backgroundImage: "repeating-linear-gradient(135deg, rgba(143,224,74,0.06) 0 12px, transparent 12px 36px)"
              }}
            />
            {/* Reticle SVG */}
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full opacity-40">
              <g stroke="var(--color-wa-green)" strokeWidth="0.8" fill="none">
                <circle cx="100" cy="100" r="80" />
                <circle cx="100" cy="100" r="60" />
                <circle cx="100" cy="100" r="40" />
                <circle cx="100" cy="100" r="20" />
                <line x1="10" y1="100" x2="190" y2="100" />
                <line x1="100" y1="10" x2="100" y2="190" />
              </g>
              <g stroke="var(--color-wa-green)" strokeWidth="1.4" fill="none">
                <path d="M20 20 L20 50 M20 20 L50 20" />
                <path d="M180 20 L180 50 M180 20 L150 20" />
                <path d="M20 180 L20 150 M20 180 L50 180" />
                <path d="M180 180 L180 150 M180 180 L150 180" />
              </g>
            </svg>
            {/* Live badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 border border-wa-line px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-[11px] tracking-[0.15em] text-white">LIVE · ARENA 01</span>
            </div>
          </div>

          {/* Next slot badge */}
          <div 
            className={`absolute -top-4 bg-wa-green text-wa-bg px-4 py-2 z-20 ${isRtl ? "-left-4" : "-right-4"}`}
            style={{ clipPath: isRtl 
              ? "polygon(0 10px, 10px 0, 100% 0, 100% 100%, 0 100%)" 
              : "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" 
            }}
          >
            <div className="font-mono text-[10px] tracking-[0.18em]">NEXT SLOT</div>
            <div className="font-archivo text-2xl leading-none">7:00 PM</div>
          </div>

          {/* Tape label */}
          <div className="absolute -bottom-3 left-4">
            <span className="wa-tape wa-tape--orange text-[11px] px-4 py-1.5">
              GEL · BLASTERS · LASER · TAG
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom marquee ticker */}
      <div className="relative z-10 bg-wa-green text-wa-bg py-2.5 overflow-hidden border-t border-black">
        <div className="flex" style={{ animation: "wa-marquee 28s linear infinite" }}>
          {[0, 1].map((_, set) => (
            <div key={set} className="flex gap-12 pe-12 shrink-0">
              {MARQUEE_ITEMS.map((item, j) => (
                <span key={j} className="font-archivo text-[14px] tracking-[0.2em] whitespace-nowrap flex items-center gap-4">
                  <span className="inline-block w-1.5 h-1.5 bg-wa-bg rotate-45" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
