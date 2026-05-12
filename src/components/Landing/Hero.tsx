"use client";

import React from "react";
import { WAButton } from "../UI/WAButton";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useBooking } from "@/contexts/BookingContext";

interface HeroProps {
  locale: string;
  hours?: string;
  cms?: any;
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

import Image from "next/image";

export const Hero: React.FC<HeroProps> = ({ locale, hours = "6 PM - 9 PM", cms }) => {
  const t = useTranslations("Landing.Hero");
  const isRtl = locale === "ar";
  const { openWizard } = useBooking();
  const prefersReducedMotion = useReducedMotion();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax layers
  const yBg = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 200]);
  const yContent = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -100]);
  const yCard = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const getCmsValue = (key: string, fallback: string) => cms?.[key] || fallback;

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden border-b border-wa-line bg-wa-bg wa-noise min-h-[90dvh] flex flex-col justify-center"
    >
      {/* Animated grid (Parallax Layer 1) */}
      <motion.div 
        style={{ y: yBg }}
        className="absolute inset-0 wa-anim-grid opacity-100" 
      />
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
      <motion.div 
        style={{ y: yContent, opacity, scale }}
        className="relative z-10 max-w-[1320px] mx-auto px-6 py-16 md:py-32 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center"
      >
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
              {getCmsValue('location_badge', t("kicker"))}
            </span>
            <span className="wa-tag wa-tag--neutral font-mono text-[10px]">
              {hours}
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
              {getCmsValue('slogan_line1', t("line1"))}
            </motion.span>
            <motion.span
              className="block text-wa-green"
              style={{ textShadow: "0 0 32px rgba(143,224,74,0.35)" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {getCmsValue('slogan_line2', t("line2"))}
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p
            className="mt-7 text-lg leading-relaxed text-wa-text-dim max-w-[520px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {getCmsValue('subtitle', t("subtitle"))}
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
          </motion.div>

          {/* Stat strip */}
          <motion.div
            className="grid grid-cols-3 gap-3 md:gap-6 mt-14 max-w-[560px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {[
              { val: getCmsValue('stat1_value', t("stat1Value")), label: getCmsValue('stat1_label', t("stat1Label")) },
              { val: getCmsValue('stat2_value', t("stat2Value")), label: getCmsValue('stat2_label', t("stat2Label")) },
              { val: getCmsValue('stat3_value', t("stat3Value")), label: getCmsValue('stat3_label', t("stat3Label")) },
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
          style={{ y: yCard }}
          className="hidden lg:block relative h-[520px]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="wa-panel border border-wa-line absolute inset-0 overflow-hidden"
            style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}>
            {/* Immersive Action Shot */}
            <Image 
              src={getCmsValue('hero_image_url', "https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&w=1200")} 
              alt="Arena Tactical" 
              fill
              priority
              className="object-cover"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom fade for smooth transition to Games section */}
      <motion.div 
        style={{ opacity: useTransform(scrollYProgress, [0.7, 1], [0, 1]) }}
        className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-wa-bg to-transparent z-20 pointer-events-none" 
      />

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
