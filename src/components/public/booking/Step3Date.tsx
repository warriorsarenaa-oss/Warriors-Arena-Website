"use client";

import React, { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar as CalendarIcon, Clock, Info, AlertTriangle } from "lucide-react";
import "react-day-picker/dist/style.css";

interface Slot {
  slot_time: string; // HH:mm:ss
  available_30: boolean;
  available_60: boolean;
  reason: string | null;
}

interface Step3DateProps {
  selectedDate?: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTime?: string; // HH:mm
  onSelectTime: (time: string) => void;
  duration: number;
  gameId?: string; // Current game ID
}

const CAIRO_TZ = "Africa/Cairo";

export const Step3Date: React.FC<Step3DateProps> = ({ 
  selectedDate, 
  onSelectDate,
  selectedTime,
  onSelectTime,
  duration,
  gameId
}) => {
  const t = useTranslations("Booking");
  const locale = useLocale();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isGameRestricted, setIsGameRestricted] = useState(false);

  // Cairo Today
  const todayCairo = new Date(formatInTimeZone(new Date(), CAIRO_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"));
  
  // ✅ Updated: Allow today (Cairo)
  const minDate = todayCairo;

  // Max date = 90 days from today
  const maxDate = new Date(todayCairo);
  maxDate.setDate(maxDate.getDate() + 90);

  const dateValue = selectedDate ? new Date(selectedDate) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, "yyyy-MM-dd");
      onSelectDate(formatted);
      onSelectTime(""); // Reset time when date changes
    }
  };

  useEffect(() => {
    async function checkGameAvailability() {
      if (!selectedDate || !gameId) return;
      
      try {
        const res = await fetch(`/api/v1/availability/games?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          const gameAvail = data.find((a: any) => a.game_id === gameId);
          setIsGameRestricted(gameAvail ? !gameAvail.is_available : false);
        }
      } catch (err) {
        console.error("Failed to check game availability", err);
      }
    }

    async function fetchAvailability() {
      if (!selectedDate) return;
      
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const res = await fetch(`/api/v1/availability?date=${selectedDate}${gameId ? `&game_id=${gameId}` : ''}`);
        if (!res.ok) throw new Error("Failed to fetch availability");
        const data = await res.json();
        setSlots(Array.isArray(data) ? data : (data.slots || []));
      } catch (err) {
        setSlotsError(err instanceof Error ? err.message : "Error loading slots");
      } finally {
        setSlotsLoading(false);
      }
    }

    checkGameAvailability();
    fetchAvailability();
  }, [selectedDate, gameId]);

  const formatTimeDisplay = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  return (
    <div className="flex flex-col gap-10">
      {/* 1. Date Selection */}
      <div className="flex flex-col gap-6 items-center">
        <div className="w-full flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 text-wa-text font-archivo text-xl uppercase">
            <CalendarIcon className="w-5 h-5 text-wa-green" />
            {t("Step3.chooseDate")}
          </label>
          {selectedDate && (
            <div className="bg-wa-green/10 px-3 py-1 border border-wa-green/30">
              <span className="text-wa-green font-archivo text-sm uppercase">
                {format(new Date(selectedDate), "dd MMM yyyy", { locale: locale === "ar" ? ar : undefined })}
              </span>
            </div>
          )}
        </div>

        <div className="wa-calendar-container p-2 sm:p-4 bg-wa-text/5 border border-wa-text/10 rounded-sm w-full flex justify-center">
          <DayPicker
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            disabled={[{ before: minDate }, { after: maxDate }]}
            locale={locale === "ar" ? ar : undefined}
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="wa-day-picker"
            modifiersStyles={{
              selected: {
                backgroundColor: "var(--warriors-green)",
                color: "var(--warriors-black)",
                fontWeight: "bold",
                borderRadius: "0",
              },
              today: {
                color: "var(--warriors-green)",
                border: "1px solid var(--warriors-green)",
              }
            }}
          />
        </div>
      </div>

      {/* 2. Time Selection (Appears when date is selected) */}
      {selectedDate && (
        <div className="flex flex-col gap-6 pt-6 border-t border-wa-gray/20 animate-in fade-in slide-in-from-top-4 duration-500">
          <label className="flex items-center gap-2 text-wa-text font-archivo text-xl uppercase">
            <Clock className="w-5 h-5 text-wa-green" />
            {t("Step4.title")}
          </label>

          {isGameRestricted ? (
            <div className="py-12 border-2 border-dashed border-wa-red/30 bg-wa-red/5 flex flex-col items-center gap-4 text-center p-6 animate-in zoom-in duration-300">
              <AlertTriangle className="w-12 h-12 text-wa-red" />
              <div>
                <h3 className="text-2xl font-archivo text-wa-red uppercase mb-2 tracking-widest">{t("Step1.restricted") || "MISSION RESTRICTED"}</h3>
                <p className="text-wa-text/60 max-w-sm font-barlow">
                  This game is not available on the selected date due to maintenance or schedule protocol. Please select another date or go back.
                </p>
              </div>
            </div>
          ) : slotsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-wa-text/5 animate-pulse border border-wa-text/10" />
              ))}
            </div>
          ) : slotsError ? (
            <div className="py-10 text-center">
              <p className="text-wa-orange font-archivo uppercase">{t("Step4.error")}</p>
              <p className="text-wa-text/40 text-xs mt-2">{slotsError}</p>
            </div>
          ) : (
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
                    onClick={() => onSelectTime(slot.slot_time.substring(0, 5))}
                    className={`relative h-16 border-2 flex items-center justify-center font-archivo transition-all duration-200 group ${stateClass}`}
                    style={{ backgroundImage: stripeStyle }}
                  >
                    <span className="relative z-10 text-lg tracking-tight">
                      {formatTimeDisplay(slot.slot_time)}
                    </span>
                    
                    {!isAvailable && slot.reason && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-wa-black border border-wa-gray text-[8px] px-2 py-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        {slot.reason === "booked" ? t("Step4.slotBooked") : slot.reason === "closing" ? t("Step4.closingSoon") : t("Step4.past")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!isGameRestricted && (
            <div className="flex flex-wrap gap-4 pt-6 border-t border-wa-gray/20">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-wa-green uppercase font-mono border-b border-wa-green/30">{t("Step4.available")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-wa-red uppercase font-mono border-b border-wa-red/30">{t("Step4.booked")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-wa-orange uppercase font-mono border-b border-wa-orange/30">{t("Step4.shortOnly")}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .wa-day-picker {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #00FF41;
          --rdp-background-color: #0A0A0A;
          margin: 0;
          color: white;
          font-family: var(--font-barlow), sans-serif;
          width: 100%;
          max-width: 350px;
        }

        /* Responsive cell size for mobile */
        @media (max-width: 400px) {
          .wa-day-picker {
            --rdp-cell-size: 44px;
          }
        }
        @media (max-width: 380px) {
          .wa-day-picker {
            --rdp-cell-size: 40px;
          }
        }
        @media (max-width: 350px) {
          .wa-day-picker {
            --rdp-cell-size: 36px;
          }
        }

        .wa-day-picker .rdp-months {
          justify-content: center;
        }

        .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
          background-color: #00FF41 !important;
          color: #0A0A0A !important;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: rgba(0, 255, 65, 0.1);
          color: #00FF41;
        }
        .rdp-nav_button {
          color: #00FF41;
        }
        .rdp-head_cell {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Fix for RTL in react-day-picker */
        [dir="rtl"] .rdp-nav {
          flex-direction: row-reverse;
        }
      `}</style>
    </div>
  );
};
