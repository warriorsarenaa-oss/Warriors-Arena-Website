"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { WAButton } from "@/components/UI/WAButton";
import { WAPanel } from "@/components/UI/WAPanel";
import { Search, SearchX, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useParams } from "next/navigation";

export default function TrackBookingPage() {
  const t = useTranslations("TrackBooking");
  const params = useParams();
  const locale = params.locale as string;
  const isRtl = locale === "ar";

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    const numericPhone = phone.replace(/\D/g, "");
    if (numericPhone.length < 7) {
      setError(locale === "ar" ? "رقم الهاتف غير صحيح" : "Invalid phone number");
      return;
    }

    setLoading(true);
    setError(null);
    setBookings(null);

    try {
      const res = await fetch(`/api/v1/bookings/lookup?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to search bookings");
      } else {
        setBookings(data);
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <div className="flex items-center gap-1.5 text-wa-green bg-wa-green/10 border border-wa-green/20 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("trackBookingStatus_completed")}
          </div>
        );
      case "cancelled":
      case "cancelled_refunded":
        return (
          <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
            <XCircle className="w-3.5 h-3.5" />
            {t("trackBookingStatus_cancelled")}
          </div>
        );
      case "confirmed":
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            {t("trackBookingStatus_confirmed")}
          </div>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return timeStr.substring(0, 5);
    }
  };

  return (
    <div className={`min-h-screen bg-wa-bg pt-20 pb-20 px-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {/* Back Button */}
        <div className="mb-2">
          <WAButton
            variant="ghost"
            className="px-0 text-wa-text-dim hover:text-wa-green border-none flex items-center gap-2"
            onClick={() => window.location.href = `/${locale}`}
          >
            {isRtl ? "رجوع للرئيسية" : "BACK TO HOME"}
          </WAButton>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-archivo text-3xl md:text-5xl uppercase tracking-tight text-wa-text">
            {t("trackBookingTitle")}
          </h1>
          <p className="text-wa-text/60 font-mono text-sm uppercase tracking-widest">
            {t("trackBookingSubtitle")}
          </p>
        </div>

        {/* Search Box */}
        <WAPanel className="p-6 md:p-8 border-wa-green/20">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("trackBookingPhone")}
                className="w-full bg-wa-bg/50 border border-wa-line rounded-lg px-4 py-3.5 text-wa-text font-mono focus:border-wa-green outline-none transition-colors"
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
            <WAButton
              type="submit"
              disabled={loading || !phone}
              className="bg-wa-green text-black font-bold whitespace-nowrap min-w-[140px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  {t("trackBookingSearch")}
                </>
              )}
            </WAButton>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-sm font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </WAPanel>

        {/* Results */}
        {bookings && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-archivo text-xl uppercase tracking-widest text-wa-text border-b border-wa-line/50 pb-4">
              {t("trackBookingResult")}
            </h2>

            {bookings.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-4 text-wa-text/40 border border-dashed border-wa-line/50 rounded-xl">
                <SearchX className="w-12 h-12" />
                <p className="font-mono text-sm uppercase tracking-widest">{t("trackBookingNotFound")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {bookings.map((booking, i) => (
                  <WAPanel key={i} className="p-6 border-wa-line/30 hover:border-wa-green/30 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] text-wa-text/50 uppercase tracking-[0.2em] font-mono">
                          {t("trackBookingCode")}
                        </div>
                        <div className="font-mono text-xl text-wa-green font-bold">
                          {booking.booking_code}
                        </div>
                      </div>
                      <div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 font-mono text-sm text-wa-text/80">
                      <div className="font-bold text-wa-text text-lg">
                        {locale === "en" ? booking.game_name_en : booking.game_name_ar}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 opacity-80">
                        <span className="text-wa-text/60">·</span>
                        <span>{formatDate(booking.booking_date)}</span>
                        <span className="text-wa-text/60">·</span>
                        <span>{formatTime(booking.start_time)}</span>
                        <span className="text-wa-text/60">·</span>
                        <span>{booking.duration_minutes} {t("trackBookingSubtitle") /* we need min actually, let's just use min */}</span>
                        <span className="text-wa-text/60">·</span>
                        <span>{booking.player_count} Players</span>
                      </div>
                    </div>
                  </WAPanel>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
