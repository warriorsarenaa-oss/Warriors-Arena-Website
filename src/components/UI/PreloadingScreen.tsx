'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function PreloadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // 1. Slower Simulated Loading Progress
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        // Smaller, more deliberate increments for longer visibility
        const inc = Math.random() * 8; 
        return Math.min(prev + inc, 100);
      });
    }, 400); // Slower interval

    const handleLoad = () => {
      // Don't finish immediately on load, give it a bit more time for the animation
      setTimeout(() => setProgress(100), 1000);
    };
// ... rest of the useEffect logic remains same

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // 3. Trigger exit animation when progress hits 100
  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        setIsExiting(true);
        // Remove from DOM after fade out
        setTimeout(() => setShouldRender(false), 800);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
        isExiting ? 'opacity-0 scale-110' : 'opacity-100'
      }`}
    >
      {/* ── BACKGROUND OVERLAYS ────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Tactical Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, #00ff50 1px, transparent 0)', 
            backgroundSize: '32px 32px' 
          }} 
        />
        
        {/* Scanlines */}
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{ 
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff50 2px, #00ff50 4px)',
            backgroundSize: '100% 4px'
          }} 
        />

        {/* Global Scan Beam */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <motion.div 
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-[#00ff50] to-transparent blur-xl"
          />
        </div>
      </div>

      {/* ── LOGO & TACTICAL SCAN ─────────────────────────── */}
      <div className="relative mb-12">
        {/* Main Logo with Tactical Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative w-48 h-48 md:w-64 md:h-64 border border-wa-green/30 p-2 bg-wa-bg/50 backdrop-blur-sm shadow-[0_0_50px_rgba(143,224,74,0.15)]"
          style={{ clipPath: "polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)" }}
        >
          <img 
            src="/logo.jpg" 
            alt="Warriors Arena" 
            className="w-full h-full object-cover"
          />
          
          {/* Tactical Scan Line */}
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 right-0 h-0.5 bg-wa-green shadow-[0_0_15px_rgba(143,224,74,1)] z-20"
          />
          
          {/* Internal Glow Pulse */}
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-wa-green pointer-events-none"
          />
        </motion.div>

        {/* HUD Elements around logo */}
        <div className="absolute -inset-8 pointer-events-none">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-wa-green/40" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-wa-green/40" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-wa-green/40" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-wa-green/40" />
        </div>
      </div>

      {/* ── TEXT & BRANDING ──────────────────────────── */}
      <div className="text-center z-10 space-y-3">
        <div className="relative">
          <h1 className="text-3xl md:text-5xl font-black tracking-[0.4em] text-white uppercase font-mono">
            WARRIORS ARENA
          </h1>
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-wa-green to-transparent mt-2 opacity-50" />
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <p className="text-[10px] md:text-xs tracking-[0.5em] text-wa-green font-mono uppercase opacity-80">
            SYSTEM INITIALIZING
          </p>
        </div>
      </div>

      {/* ── LOADING PROGRESS ─────────────────────────── */}
      <div className="mt-16 w-64 md:w-80">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-mono text-[#00ff50]/40 uppercase tracking-widest">System Status</span>
          <span className="text-xs font-mono text-[#00ff50] font-bold">
            {Math.floor(progress)}%
          </span>
        </div>
        
        <div className="h-1 w-full bg-wa-green/10 rounded-full overflow-hidden border border-wa-green/10">
          <motion.div 
            className="h-full bg-[#00ff50] shadow-[0_0_15px_#00ff50]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Tactical Footer Text */}
        <div className="mt-4 flex justify-between opacity-30">
          <span className="text-[8px] font-mono uppercase tracking-tighter">OS: WARRIORS-v2.0</span>
          <span className="text-[8px] font-mono uppercase tracking-tighter text-[#00ff50]">Connection: Secure</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes glowPulse {
          0%, 100% {
            filter: drop-shadow(0 0 5px #00ff50) drop-shadow(0 0 10px #00ff5066);
          }
          50% {
            filter: drop-shadow(0 0 15px #00ff50) drop-shadow(0 0 30px #00ff50);
          }
        }

        .animate-glow-pulse {
          animation: glowPulse 3s ease-in-out infinite;
        }

        @keyframes glitch1 {
          0%, 100% { transform: translate(2px, 0); }
          50% { transform: translate(-2px, 1px); }
        }
        @keyframes glitch2 {
          0%, 100% { transform: translate(-2px, 0); }
          50% { transform: translate(2px, -1px); }
        }

        .animate-glitch-1 {
          animation: glitch1 0.2s infinite;
        }
        .animate-glitch-2 {
          animation: glitch2 0.3s infinite;
        }
      `}</style>
    </div>
  );
}
