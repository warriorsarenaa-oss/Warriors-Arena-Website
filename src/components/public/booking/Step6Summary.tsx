"use client";

import React, { useState, useEffect } from "react";
import { buildWhatsAppConfirmationMessage, buildWhatsAppLink } from "@/utils/whatsapp";
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
  const [whatsappOpened, setWhatsappOpened] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Build the pre-filled WhatsApp message
  const whatsappMessage = buildWhatsAppConfirmationMessage({
    game_name: gameName,
    booking_date: bookingData.date,
    start_time: bookingData.start_time,
    end_time: calculateEndTime(bookingData.start_time, bookingData.duration_minutes),
    player_count: bookingData.player_count,
    total_amount: totalAmount,
    customer_name: bookingData.customer_name,
    customer_phone: bookingData.customer_phone,
    mission_name: missionName,
    locale,
  });

  const whatsappLink = buildWhatsAppLink(whatsappMessage);

  // SUBMIT is only enabled when both conditions are met
  const canSubmit = whatsappOpened && confirmed;

  const handleWhatsAppClick = () => {
    // Open WhatsApp in new tab
    window.open(whatsappLink, "_blank", "noopener,noreferrer");
    // Mark as opened after a short delay (give WhatsApp time to open)
    setTimeout(() => setWhatsappOpened(true), 1000);
  };

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
      </div>

      {/* ── Step 1: WhatsApp Confirmation (mandatory) ── */}
      <div
        className={`
        border p-6 transition-colors duration-200
        ${
          whatsappOpened
            ? "border-wa-green bg-wa-green/5"
            : "border-wa-gray/20"
        }
      `}
      >
        <div className="flex items-start gap-4 mb-6">
          {/* Step indicator */}
          <div
            className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5
            ${
              whatsappOpened
                ? "bg-wa-green text-wa-black"
                : "bg-wa-text/10 text-wa-text/40"
            }
          `}
          >
            {whatsappOpened ? "✓" : "1"}
          </div>

          <div className="flex-1">
            <p className="text-wa-text text-sm font-bold tracking-wide uppercase mb-1">
              {locale === "ar" ? "تأكيد عبر واتساب" : "Confirm via WhatsApp"}
            </p>
            <p className="text-wa-text/50 text-xs leading-relaxed">
              {locale === "ar"
                ? "يجب إرسال رسالة واتساب للتأكيد قبل إتمام الحجز."
                : "Send a WhatsApp message to confirm your booking details before submitting."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWhatsAppClick}
          className={`
            w-full py-4 px-6 font-mono font-bold text-xs tracking-[3px] uppercase
            flex items-center justify-center gap-3 transition-all duration-300
            ${
              whatsappOpened
                ? "bg-wa-black text-wa-green border border-wa-green/30"
                : "bg-[#25D366] text-white hover:bg-[#20b957] shadow-[0_0_20px_rgba(37,211,102,0.2)]"
            }
          `}
        >
          {/* WhatsApp icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {whatsappOpened
            ? locale === "ar"
              ? "✓ تم فتح واتساب"
              : "✓ WhatsApp Opened"
            : locale === "ar"
            ? "فتح واتساب للتأكيد"
            : "Open WhatsApp to Confirm"}
        </button>
      </div>

      {/* ── Step 2: Acknowledgement checkbox (only shown after WhatsApp opened) ── */}
      {whatsappOpened && (
        <div
          className={`
          border p-6 transition-all duration-300
          ${confirmed ? "border-wa-green bg-wa-green/5" : "border-wa-gray/10"}
        `}
        >
          <label className="flex items-start gap-4 cursor-pointer group">
            {/* Custom checkbox */}
            <div
              onClick={() => setConfirmed(!confirmed)}
              className={`
                w-6 h-6 border-2 shrink-0 mt-0.5 flex items-center justify-center
                transition-all duration-200 cursor-pointer
                ${
                  confirmed
                    ? "border-wa-green bg-wa-green"
                    : "border-wa-text/20 group-hover:border-wa-green"
                }
              `}
            >
              {confirmed && (
                <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1.5 5L4 7.5L8.5 2.5"
                    stroke="black"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            <span
              className="text-xs text-wa-text/60 leading-relaxed cursor-pointer font-barlow select-none"
              onClick={() => setConfirmed(!confirmed)}
            >
              {locale === "ar"
                ? "لقد أرسلت رسالة واتساب وأفهم أن حجزي سيتم تأكيده بعد استلام العربون."
                : "I have sent the WhatsApp message and understand my booking will be confirmed after the deposit is received."}
            </span>
          </label>
        </div>
      )}

      {/* ── Locked state hint (before WhatsApp is opened) ── */}
      {!whatsappOpened && (
        <p className="text-center text-[10px] text-wa-error/60 tracking-widest font-mono uppercase animate-pulse">
          {locale === "ar"
            ? "⚠️ يجب تأكيد الحجز عبر واتساب أولاً"
            : "⚠️ WhatsApp confirmation required to complete booking"}
        </p>
      )}

      {/* ── SUBMIT BUTTON ── */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className={`
          w-full py-5 font-mono font-black text-xs tracking-[5px] uppercase
          transition-all duration-300 relative overflow-hidden group
          ${
            canSubmit && !isSubmitting
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
          ) : canSubmit ? (
            locale === "ar" ? (
              "إتمام الحجز ←"
            ) : (
              "Complete Booking →"
            )
          ) : (
            <>
              🔒 {locale === "ar" ? "أكمل خطوات التأكيد أولاً" : "Complete confirmation steps first"}
            </>
          )}
        </span>
        
        {/* Animated background on hover */}
        {canSubmit && !isSubmitting && (
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
