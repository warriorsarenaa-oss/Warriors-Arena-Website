"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Info } from "lucide-react";

interface Slot {
  slot_time: string; // HH:mm:ss
  available_30: boolean;
  available_60: boolean;
  reason: string | null;
}

interface Step4TimeProps {
  date: string;
  duration: number;
  selectedTime?: string;
  onSelect: (time: string) => void;
}

export const Step4Time: React.FC<Step4TimeProps> = ({
  date,
  duration,
  selectedTime,
  onSelect,
}) => {
  const t = useTranslations("Booking.Step4");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/availability?date=${date}`);
        if (!res.ok) throw new Error("Failed to fetch availability");
        const data = await res.json();
        setSlots(Array.isArray(data) ? data : (data.slots || []));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading slots");
      } finally {
        setLoading(false);
      }
    }

    if (date) {
      fetchAvailability();
    }
  }, [date]);

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-16 bg-wa-text/5 animate-pulse border border-wa-text/10" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-wa-orange font-archivo uppercase">{t("error")}</p>
        <p className="text-wa-text/40 text-xs mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {slots.map((slot) => {
          const isAvailable = duration === 60 ? slot.available_60 : slot.available_30;
          const isSelected = selectedTime === slot.slot_time.substring(0, 5);
          
          let stateClass = "border-wa-text/10 text-wa-text/20 cursor-not-allowed";
          let stripeStyle = "";

          if (isAvailable) {
            stateClass = isSelected 
              ? "border-wa-green bg-wa-green/10 text-wa-text shadow-[0_0_15px_rgba(0,255,65,0.2)]" 
              : "border-wa-text/20 text-wa-text hover:border-wa-green hover:text-wa-green cursor-pointer";
          } else {
             if (slot.reason === "booked") {
               stripeStyle = "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,59,59,0.1) 5px, rgba(255,59,59,0.1) 10px)";
               stateClass += " border-red-900/30";
             } else if (slot.reason === "closing" && duration === 60) {
               stripeStyle = "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,107,0,0.1) 5px, rgba(255,107,0,0.1) 10px)";
               stateClass += " border-wa-orange/30";
             }
          }

          return (
            <button
              key={slot.slot_time}
              disabled={!isAvailable}
              onClick={() => onSelect(slot.slot_time.substring(0, 5))}
              className={`relative h-16 border-2 flex items-center justify-center font-archivo transition-all duration-200 group ${stateClass}`}
              style={{ backgroundImage: stripeStyle }}
            >
              <span className="relative z-10 text-lg tracking-tight">
                {formatTime(slot.slot_time)}
              </span>
              
              {/* Tooltip on Hover */}
              {!isAvailable && slot.reason && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-wa-black border border-wa-gray text-[8px] px-2 py-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  {slot.reason === "booked" ? t("slotBooked") : slot.reason === "closing" ? t("closingSoon") : t("past")}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid Legend */}
      <div className="flex flex-wrap gap-4 pt-6 border-t border-wa-gray/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-wa-green" />
          <span className="text-[10px] text-wa-text/40 uppercase font-mono">{t("available")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-red-900/30" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,59,59,0.2) 2px, rgba(255,59,59,0.2) 4px)" }} />
          <span className="text-[10px] text-wa-text/40 uppercase font-mono">{t("booked")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-wa-orange/30" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,107,0,0.2) 2px, rgba(255,107,0,0.2) 4px)" }} />
          <span className="text-[10px] text-wa-text/40 uppercase font-mono">{t("shortOnly")}</span>
        </div>
      </div>
    </div>
  );
};
