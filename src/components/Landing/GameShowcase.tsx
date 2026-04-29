"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Users, 
  ShieldCheck, 
  ChevronRight, 
  Crosshair,
  Target,
  Activity
} from "lucide-react";
import { WAButton } from "../UI/WAButton";
import { useBooking } from "@/contexts/BookingContext";

interface GameData {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number | null;
  features: {
    label: string;
    value: number; // 0-100
    icon: string;
  }[];
  stats: {
    intensity: string;
    capacity: string;
  };
}

interface GameShowcaseProps {
  games: GameData[];
  locale?: string;
}

export const GameShowcase: React.FC<GameShowcaseProps> = ({ games, locale = "en" }) => {
  const isRtl = locale === "ar";
  const [activeIdx, setActiveIdx] = useState(0);
  const { openWizard } = useBooking();
  
  if (games.length === 0) return null;

  const current = games[activeIdx];
  const isAlt = activeIdx % 2 !== 0;

  // Animation variants
  const containerVars: import("framer-motion").Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 } as const
    }
  };

  const itemVars: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(12px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring" as const, stiffness: 100, damping: 20 }
    }
  };

  const imageVars = (alt: boolean): import("framer-motion").Variants => ({
    initial: {
      opacity: 0,
      scale: 1.2,
      filter: "blur(20px)",
      rotate: alt ? 25 : -25,
      x: alt ? 60 : -60,
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      rotate: 0,
      x: 0,
      transition: { type: "spring" as const, stiffness: 200, damping: 22 }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      filter: "blur(20px)",
      transition: { duration: 0.3 }
    }
  });

  return (
    <div id="games-section" className="relative w-full py-12 will-change-contents">
      {/* Background Glow - Optimized: Use two layers and cross-fade them to avoid background-string re-computation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${!isAlt ? "opacity-100" : "opacity-0"}`}
          style={{ background: "radial-gradient(circle at 10% 50%, rgba(143, 224, 74, 0.12), transparent 55%)" }}
        />
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isAlt ? "opacity-100" : "opacity-0"}`}
          style={{ background: "radial-gradient(circle at 90% 50%, rgba(143, 224, 74, 0.12), transparent 55%)" }}
        />
      </div>

      <div className="max-w-[1320px] mx-auto px-6">
        <motion.div
          layout="position"
          transition={{ type: "spring" as const, bounce: 0, duration: 0.9, restDelta: 0.5 }}
          className={`flex flex-col lg:flex-row items-center justify-center gap-16 md:gap-24 w-full ${
            isAlt ? "lg:flex-row-reverse" : "lg:flex-row"
          }`}
        >
          {/* VISUAL COLUMN */}
          <motion.div layout="position" className="relative group shrink-0 will-change-transform">
            {/* Animated HUD Rings - use pure CSS animation for better perf */}
            <div 
              className="absolute inset-[-15%] rounded-full border border-dashed border-wa-green/20 animate-[spin_40s_linear_infinite]"
            />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-wa-green/10 blur-3xl opacity-30 pointer-events-none"
            />

            {/* Frame */}
            <div className="relative h-72 w-72 md:h-[480px] md:w-[480px] wa-panel wa-panel-clip flex items-center justify-center bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl">
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="w-full h-full p-10 will-change-transform"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={current.id}
                    src={current.image}
                    alt={current.name}
                    variants={imageVars(isAlt)}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(143,224,74,0.25)]"
                    loading="eager"
                  />
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Intensity Badge */}
            <motion.div
              layout="position"
              className="absolute -bottom-6 left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-2 bg-wa-bg/90 border border-wa-line px-4 py-2 wa-panel-clip-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-wa-green animate-pulse" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-wa-text-dim uppercase">
                  {isRtl ? "الحالة" : "STATUS"} · {current.stats.intensity}
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* CONTENT COLUMN */}
          <motion.div layout="position" className="w-full max-w-xl will-change-transform">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                variants={containerVars}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: "spring" as const, bounce: 0, duration: 0.6 }}
                className={`flex flex-col ${isAlt ? "lg:items-end lg:text-right" : "lg:items-start lg:text-left"}`}
              >
                <motion.div variants={itemVars} className="wa-tag mb-4">
                  {isRtl ? "المهمة" : "MISSION"} 0{activeIdx + 1}
                </motion.div>
                
                <motion.h2 variants={itemVars} className="font-archivo text-5xl md:text-7xl leading-none text-wa-text uppercase mb-4">
                  {current.name}
                </motion.h2>
                
                <motion.p variants={itemVars} className="text-wa-text-dim text-lg leading-relaxed mb-10 max-w-lg">
                  {current.description}
                </motion.p>

                {/* Feature Artifacts */}
                <motion.div variants={itemVars} className="w-full space-y-6 bg-wa-panel-2/30 p-8 border border-wa-line wa-panel-clip">
                  {current.features.map((f, i) => (
                    <div key={f.label} className="group">
                      <div className={`flex items-center justify-between mb-3 ${isAlt ? "flex-row-reverse" : "flex-row"}`}>
                        <div className="flex items-center gap-3 text-wa-text font-archivo tracking-wider uppercase text-sm">
                          {(() => {
                            const iconMap = {
                              zap: Zap,
                              target: Target,
                              activity: Activity,
                              users: Users,
                              shield: ShieldCheck
                            };
                            const Icon = iconMap[f.icon as keyof typeof iconMap] || Target;
                            return <Icon size={18} className="text-wa-green" />;
                          })()}
                          {f.label}
                        </div>
                        <span className="font-mono text-[11px] text-wa-text-mute">{f.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-wa-bg-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${f.value}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                          className="h-full bg-wa-green shadow-[0_0_10px_rgba(143,224,74,0.5)]"
                        />
                      </div>
                    </div>
                  ))}

                  <div className={`pt-6 flex ${isAlt ? "justify-end" : "justify-start"}`}>
                    <WAButton variant="primary" size="lg" onClick={() => openWizard({ kind: "game", id: current.id })}>
                      {isRtl ? "احجز هذه المهمة" : "LOCK THIS MISSION"} 
                      {isRtl ? <ChevronRight size={18} className="mr-2 rotate-180" /> : <ChevronRight size={18} className="ml-2" />}
                    </WAButton>
                  </div>
                </motion.div>

                {/* Foot stats */}
                <motion.div variants={itemVars} className={`mt-8 flex items-center gap-6 text-wa-text-dim ${isAlt ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
                   <div className="flex items-center gap-2">
                     <Users size={16} />
                     <span className="font-mono text-[11px] tracking-wide">{current.stats.capacity}</span>
                   </div>
                   <div className="w-1 h-1 bg-wa-line rounded-full" />
                   <div className="flex items-center gap-2 font-archivo text-wa-green text-sm">
                     {isRtl ? "يبدأ من" : "FROM"} {current.price} {isRtl ? "ج.م / لاعب" : "EGP / PLAYER"}
                   </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* SWITCHER HUD */}
        <div className="mt-16 sm:mt-24 flex justify-center">
          <div className="flex items-center gap-2 p-1.5 bg-wa-bg/80 border border-wa-line wa-panel-clip backdrop-blur-xl">
            {games.map((game, i) => (
              <button
                key={game.id}
                onClick={() => setActiveIdx(i)}
                className={`relative px-6 py-3 font-archivo text-sm tracking-widest transition-all ${
                  activeIdx === i ? "text-wa-bg" : "text-wa-text-dim hover:text-wa-text"
                }`}
              >
                {activeIdx === i && (
                  <motion.div
                    layoutId="game-active-surface"
                    className="absolute inset-0 bg-wa-green wa-panel-clip-sm"
                    transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  />
                )}
                <span className="relative z-10">{game.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
