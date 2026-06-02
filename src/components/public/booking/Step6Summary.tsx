"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface Step6SummaryProps {
  bookingData: any; // Using any for flexibility with draft
  gameName: string;
  missionName?: string | null;
  totalAmount: number;
  onSubmit: () => void;
  isSubmitting: boolean;
  locale: "en" | "ar";
}

export const Step6Summary: React.FC<Step6SummaryProps> = ({
  bookingData,
  gameName,
  missionName,
  totalAmount,
  onSubmit,
  isSubmitting,
  locale,
}) => {
  const t = useTranslations("Booking");

  return (
    <div className="space-y-6">
      {/* ── Booking Summary ── */}
      <div className="border border-wa-gray/20 p-6 space-y-4 font-mono bg-wa-text/5">
        <h3 className="text-wa-green text-xs tracking-[4px] uppercase mb-4">
          {locale === "ar" ? "ملخص الحجز" : "Booking Summary"}
        </h3>

        <SummaryRow
          label={locale === "ar" ? "اللعبة" : "Game"}
          value={gameName}
        />
        <SummaryRow
          label={locale === "ar" ? "التاريخ" : "Date"}
          value={bookingData.date}
        />
        <SummaryRow
          label={locale === "ar" ? "الوقت" : "Time"}
          value={`${bookingData.start_time} — ${calculateEndTime(bookingData.start_time, bookingData.duration_minutes)}`}
        />
        <SummaryRow
          label={locale === "ar" ? "عدد اللاعبين" : "Players"}
          value={String(bookingData.player_count)}
        />
        {missionName && (
          <SummaryRow
            label={locale === "ar" ? "المهمة" : "Mission"}
            value={missionName}
          />
        )}

        {/* Divider */}
        <div className="h-px bg-wa-gray/20 my-2" />

        <SummaryRow
          label={locale === "ar" ? "الإجمالي" : "Total"}
          value={`${totalAmount} EGP`}
          highlight
        />

        {/* Divider */}
        <div className="h-px bg-wa-gray/20 my-2" />

        <SummaryRow
          label={locale === "ar" ? "الاسم" : "Name"}
          value={bookingData.customer_name || "—"}
        />
        <SummaryRow
          label={locale === "ar" ? "الموبايل" : "Phone"}
          value={bookingData.customer_phone || "—"}
        />
      </div>

      {/* ── SUBMIT BUTTON ── */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className={`
          w-full py-5 font-mono font-black text-xs tracking-[5px] uppercase
          transition-all duration-300 relative overflow-hidden group
          ${
            !isSubmitting
              ? "bg-wa-green text-wa-black hover:scale-[1.02] active:scale-[0.98]"
              : "bg-wa-black text-wa-text/20 border border-wa-gray/20 cursor-not-allowed"
          }
        `}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isSubmitting ? (
            <>
               <span className="w-4 h-4 border-2 border-wa-black/30 border-t-wa-black rounded-full animate-spin" />
               {locale === "ar" ? "جاري الحجز..." : "Submitting..."}
            </>
          ) : (
            locale === "ar" ? (
              "إتمام الحجز ←"
            ) : (
              "Complete Booking →"
            )
          )}
        </span>
        
        {/* Animated background on hover */}
        {!isSubmitting && (
           <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        )}
      </button>
    </div>
  );
};

// Helper sub-component for summary rows
function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-[10px] tracking-[2px] text-wa-text/40 uppercase">
        {label}
      </span>
      <span
        className={`text-xs font-bold font-mono ${
          highlight ? "text-wa-green" : "text-wa-text"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// Utility to calculate end time
function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return "";
  try {
    const [h, m] = startTime.split(":").map(Number);
    const totalMins = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  } catch {
    return "";
  }
}
