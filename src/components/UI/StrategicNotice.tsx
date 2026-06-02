"use client";

import React from "react";
import { Info, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";

interface StrategicNoticeProps {
  type?: "info" | "warning";
  className?: string;
}

export const StrategicNotice: React.FC<StrategicNoticeProps> = ({ 
  type = "info",
  className = ""
}) => {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const content = isRtl 
    ? "رسوم الحجز لا تشمل دخول الحديقة — 30 جنيه للفرد في الأيام العادية، 50 جنيه للفرد في العطلات والمهرجانات."
    : "Reservation fees do not include park entrance — 30 EGP/person regular days, 50 EGP/person on holidays and festivals.";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-5 overflow-hidden border-2 ${
        type === "warning" ? "border-wa-orange bg-wa-orange/10" : "border-wa-green bg-wa-green/10"
      } ${className} rounded-lg`}
    >
      {/* Pulse background effect */}
      <motion.div 
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute inset-0 ${type === "warning" ? "bg-wa-orange" : "bg-wa-green"}`}
      />

      {/* Decorative scanning line */}
      <motion.div 
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className={`absolute left-0 right-0 h-[1px] ${type === "warning" ? "bg-wa-orange/30" : "bg-wa-green/30"} pointer-events-none`}
      />

      <div className={`flex items-center gap-5 relative z-10 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`shrink-0 p-2 rounded-full ${type === "warning" ? "bg-wa-orange/20 text-wa-orange" : "bg-wa-green/20 text-wa-green"}`}>
          {type === "warning" ? <AlertCircle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
        </div>
        <div className={`space-y-1 flex-1 ${isRtl ? "text-right" : "text-left"}`}>
          <span className={`block text-[10px] font-mono uppercase tracking-[0.3em] font-bold ${type === "warning" ? "text-wa-orange" : "text-wa-green"}`}>
            {isRtl ? "تنبيه استراتيجي هام" : "CRITICAL MISSION INTEL"}
          </span>
          <p className="text-sm md:text-base font-barlow font-bold text-wa-text leading-snug">
            {content}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
