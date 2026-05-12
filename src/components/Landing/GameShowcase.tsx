"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  ChevronRight, 
  Target,
  Activity,
  Zap,
  Crosshair
} from "lucide-react";
import { WAButton } from "../UI/WAButton";
import { useBooking } from "@/contexts/BookingContext";

function LinearGauge({ name, value, delay = 0 }: { name: string; value: number; delay?: number }) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-mono font-bold text-wa-text/40 uppercase tracking-[0.2em]">{name}</span>
        <span className="text-xs font-mono font-bold text-wa-green">{value}%</span>
      </div>
      <div className="relative h-3 bg-wa-green/5 border border-wa-green/20 rounded-full overflow-hidden">
        {/* Track Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(90deg, #8FE04A 1px, transparent 1px)', backgroundSize: '10%' }} />
        
        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, delay, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-wa-green/60 to-wa-green shadow-[0_0_15px_rgba(143,224,74,0.4)]"
        >
          {/* Scanning Line */}
          <motion.div 
            animate={{ left: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-1/4 bg-white/20 blur-md"
          />
        </motion.div>
      </div>
    </div>
  );
}

interface GameData {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number | null;
  features: {
    label: string;
    value: number;
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
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
  const pauseTimer = useRef<NodeJS.Timeout | null>(null);
  const { openWizard } = useBooking();
  
  const nextGame = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % games.length);
  }, [games.length]);

  // Auto-play logic
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimer.current = setInterval(nextGame, 8000);
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isAutoPlaying, nextGame]);

  const handleManualSwitch = (idx: number) => {
    setActiveIdx(idx);
    setIsAutoPlaying(false);
    
    // Resume auto-play after 15 seconds of inactivity
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 15000);
  };

  if (games.length === 0) return null;

  const current = games[activeIdx];

  return (
    <div className="relative w-full py-12">
      {/* ── TABS (The Switcher) ────────────────────────── */}
      <div className="flex justify-center mb-12 sm:mb-20">
        <div className="inline-flex p-1 bg-wa-bg/80 border border-wa-green/20 rounded-xl backdrop-blur-xl relative overflow-hidden">
          {/* Animated Background Pulse */}
          <div className="absolute inset-0 bg-wa-green/5 animate-pulse" />
          
          {games.map((game, i) => (
            <button
              key={game.id}
              onClick={() => handleManualSwitch(i)}
              className={`relative px-8 py-3 font-archivo text-sm tracking-[0.2em] transition-all duration-300 uppercase z-10 ${
                activeIdx === i ? "text-wa-bg" : "text-wa-text/40 hover:text-wa-text/80"
              }`}
            >
              {activeIdx === i && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-wa-green rounded-lg shadow-[0_0_20px_rgba(143,224,74,0.3)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 font-bold">{game.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SHOWCASE CONTENT ──────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center"
          >
            {/* Left Column: Tactical Visuals */}
            <div className="relative order-2 lg:order-1">
              {/* Decorative HUD Elements */}
              <div className="absolute -inset-10 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-wa-green rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-wa-green rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-wa-green rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-wa-green rounded-br-3xl" />
              </div>

              <div className="relative aspect-square max-w-[500px] mx-auto overflow-hidden bg-gradient-to-br from-wa-green/10 to-transparent border border-wa-green/20 rounded-[3rem]">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #8FE04A 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                
                <motion.img
                  initial={{ scale: 1.2, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8 }}
                  src={current.image}
                  alt={current.name}
                  className="w-full h-full object-contain p-12 drop-shadow-[0_0_50px_rgba(143,224,74,0.3)]"
                />

                {/* Tactical Status Badge */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-wa-green/60 uppercase tracking-widest block">Operational Capacity</span>
                    <span className="text-sm font-mono text-wa-text font-bold uppercase">{current.stats.capacity}</span>
                  </div>
                  <div className="bg-wa-green text-wa-bg px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-wa-bg animate-pulse" />
                    Live Status
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Mission Briefing */}
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-[2px] w-12 bg-wa-green" />
                  <span className="text-xs font-mono font-bold text-wa-green uppercase tracking-[0.4em]">Mission Loadout</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-archivo text-wa-text uppercase leading-none tracking-tighter">
                  {current.name}
                </h2>
                <p className="text-lg md:text-xl text-wa-text/60 font-barlow leading-relaxed max-w-lg">
                  {current.description}
                </p>
              </div>

              {/* Stats & Gauges */}
              <div className="bg-wa-surface/30 border border-wa-green/10 p-8 rounded-[2rem] space-y-8 relative overflow-hidden">
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-wa-green/5 -rotate-45 translate-x-12 -translate-y-12" />
                
                <div className="space-y-6">
                  {current.features.map((f, i) => (
                    <LinearGauge key={f.label} name={f.label} value={f.value} delay={0.2 + (i * 0.1)} />
                  ))}
                </div>

                <div className="pt-6 border-t border-wa-green/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-wa-text/40 uppercase tracking-widest block">Mission Cost</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-wa-text/60">FROM</span>
                      <span className="text-2xl font-archivo text-wa-green">{current.price}</span>
                      <span className="text-xs font-bold text-wa-text/60 uppercase">EGP / PLAYER</span>
                    </div>
                  </div>

                  <WAButton 
                    variant="primary" 
                    size="lg" 
                    onClick={() => openWizard({ kind: "game", id: current.id })}
                    className="w-full sm:w-auto px-10 group"
                  >
                    {isRtl ? "احجز المهمة" : "BOOK NOW"}
                    <ChevronRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </WAButton>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── AUTO-ROTATE PROGRESS BAR ─────────────────── */}
      <div className="mt-16 flex justify-center">
        <div className="flex gap-2 items-center">
          {games.map((_, i) => (
            <div key={i} className="relative w-8 h-1 bg-wa-green/10 rounded-full overflow-hidden">
              {activeIdx === i && isAutoPlaying && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  className="absolute inset-y-0 left-0 bg-wa-green shadow-[0_0_10px_rgba(143,224,74,0.5)]"
                />
              )}
              {activeIdx === i && !isAutoPlaying && (
                <div className="absolute inset-0 bg-wa-green/40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
