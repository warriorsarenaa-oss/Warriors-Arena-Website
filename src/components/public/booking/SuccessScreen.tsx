import React, { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { StrategicNotice } from "@/components/UI/StrategicNotice";
import { useVenueSettings } from "@/hooks/useVenueSettings";
import { 
  CheckCircle2, 
  Copy, 
  Download, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Users, 
  ArrowLeft,
  AlertTriangle 
} from "lucide-react";
import Link from "next/link";

interface SuccessScreenProps {
  bookingData: {
    booking_id: string;
    booking_code: string;
    total_price: number;
    deposit_amount: number;
    whatsapp_link: string;
    customer_phone: string;
  };
  selection: {
    gameName: string;
    date: string;
    startTime: string;
    playerCount: number;
    missionName?: string | null;
  };
  onClose?: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  bookingData,
  selection,
  onClose,
}) => {
  const t = useTranslations("Booking.Success");
  const locale = useLocale();
  const { settings } = useVenueSettings();

  const hasDeposit = Number(bookingData.deposit_amount) > 0;
  const balanceDue = bookingData.total_price - bookingData.deposit_amount;

  const copyToClipboard = () => {
    if (!bookingData.booking_code) return;
    navigator.clipboard.writeText(bookingData.booking_code);
    alert(t("codeCopied"));
  };

  const handleDownloadReceipt = async () => {
    if (!bookingData.booking_code) {
      console.error("No booking code for receipt download");
      return;
    }
    const phoneLast4 = bookingData.customer_phone.slice(-4);
    const url = `/api/v1/bookings/${bookingData.booking_code}/receipt?phone_last4=${phoneLast4}&locale=${locale}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download receipt');
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `WA-${bookingData.booking_code}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Receipt download failed:', error);
      alert("Failed to download receipt. Please try again later.");
    }
  };

  const formattedTime = useMemo(() => {
    if (!selection.startTime) return "N/A";
    const [hours, minutes] = selection.startTime.split(':');
    const hourNum = parseInt(hours);
    const isPM = hourNum >= 12;
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minutes} ${isPM ? 'PM' : 'AM'}`;
  }, [selection.startTime]);

  const formattedDate = useMemo(() => {
    if (!selection.date) return "N/A";
    try {
      const dateObj = new Date(selection.date);
      return dateObj.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return selection.date;
    }
  }, [selection.date, locale]);

  return (
    <div className="flex flex-col gap-10 max-w-2xl mx-auto py-10 px-4">
      {/* 0. Critical Notice */}
      <StrategicNotice type="warning" />

      {/* 1. Hero Message */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 bg-wa-green/20 rounded-full flex items-center justify-center border-4 border-wa-green animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-wa-green" />
        </div>
        <h1 className="text-4xl md:text-5xl font-archivo uppercase text-wa-green tracking-tight">
          {t("confirmed")}
        </h1>
        <p className="text-wa-text/60 font-barlow text-lg max-w-md">
          {hasDeposit ? t("successNote") : "Your mission is locked. No deposit required. Pay full amount on arrival."}
        </p>
      </div>

      {/* 2. Booking ID Card */}
      <WAPanel hot className="p-1 items-center justify-center">
        <div className="bg-wa-black p-8 flex flex-col items-center gap-4 text-center w-full">
          <span className="text-wa-text/40 font-mono text-[10px] uppercase tracking-[0.4em]">{t("bookingId")}</span>
          <div className="flex items-center gap-4">
            <span className="text-3xl md:text-4xl font-archivo text-wa-text tracking-[0.1em]">
              {bookingData.booking_code || "N/A"}
            </span>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-wa-green/10 text-wa-green transition-colors"
              title={t("copyCode")}
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
      </WAPanel>

      {/* 3. Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-wa-text/5 p-4 border border-wa-text/10 rounded-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] text-wa-text/40 uppercase font-mono">
            <Calendar className="w-3 h-3" /> {t("date")}
          </div>
          <span className="font-archivo text-wa-text uppercase">{formattedDate}</span>
        </div>
        <div className="bg-wa-text/5 p-4 border border-wa-text/10 rounded-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] text-wa-text/40 uppercase font-mono">
            <Clock className="w-3 h-3" /> {t("time")}
          </div>
          <span className="font-archivo text-wa-text uppercase">{formattedTime}</span>
        </div>
        <div className="bg-wa-text/5 p-4 border border-wa-text/10 rounded-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] text-wa-text/40 uppercase font-mono">
            <Users className="w-3 h-3" /> {t("players")}
          </div>
          <span className="font-archivo text-wa-text uppercase">{selection.playerCount} {t("units")}</span>
        </div>
        {selection.missionName && (
          <div className="bg-wa-text/5 p-4 border border-wa-text/10 rounded-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] text-wa-text/40 uppercase font-mono">
              <CheckCircle2 className="w-3 h-3" /> {t("mission")}
            </div>
            <span className="font-archivo text-wa-green uppercase line-clamp-1">{selection.missionName}</span>
          </div>
        )}
      </div>

      {/* 4. Payment Alert */}
      <div className={`border p-6 flex flex-col gap-6 ${hasDeposit ? "bg-wa-orange/10 border-wa-orange/30" : "bg-wa-green/10 border-wa-green/30"}`}>
        <div className="flex items-start gap-3">
          {hasDeposit ? <AlertTriangle className="w-6 h-6 mt-1 flex-shrink-0 text-wa-orange" /> : <CheckCircle2 className="w-6 h-6 mt-1 flex-shrink-0 text-wa-green" />}
          <div>
            <h3 className={`font-archivo uppercase text-xl mb-2 ${hasDeposit ? "text-wa-orange" : "text-wa-green"}`}>
              {hasDeposit ? t("paymentRequired") : "MISSION SECURED"}
            </h3>
            <p className="text-xs text-wa-text/80 leading-relaxed font-barlow">
              {hasDeposit 
                ? t("paymentNote", { deposit: bookingData.deposit_amount, ident: "InstaPay: warriors.arena" })
                : "Your reservation is confirmed. Please arrive 15 minutes early. The total amount is payable upon arrival at the venue."}
            </p>
          </div>
        </div>
        
        <div className={`space-y-3 pt-4 border-t ${hasDeposit ? "border-wa-orange/20" : "border-wa-green/20"}`}>
          {hasDeposit && (
            <div className="flex justify-between items-center text-wa-orange font-archivo text-xl uppercase">
              <span>{t("depositToSecure")}</span>
              <span>{bookingData.deposit_amount} EGP</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm text-wa-text/60 font-barlow">
            <span>Total Mission Price</span>
            <span>{bookingData.total_price} EGP</span>
          </div>
          <div className={`flex justify-between items-center ${hasDeposit ? "text-sm text-wa-text/60 font-barlow" : "text-xl font-archivo text-wa-green uppercase"}`}>
            <span>{hasDeposit ? "Balance Due on Arrival" : "TOTAL DUE ON ARRIVAL"}</span>
            <span>{balanceDue} EGP</span>
          </div>
        </div>
      </div>

      {/* 5. CTAs */}
      <div className="flex flex-col gap-4">
        <WAButton 
          variant="primary" 
          onClick={() => window.open(bookingData.whatsapp_link, "_blank")}
          className="w-full flex items-center justify-center gap-3 py-6"
        >
          <MessageCircle className="w-6 h-6" />
          {t("sendWhatsApp")}
        </WAButton>

        <WAButton 
          variant="ghost" 
          onClick={handleDownloadReceipt}
          className="w-full flex items-center justify-center gap-3 py-4"
        >
          <Download className="w-5 h-5" />
          {t("downloadReceipt")}
        </WAButton>

        <Link href={`/${locale}`} passHref className="w-full">
          <WAButton 
            variant="ghost" 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 text-wa-text/40 border-none hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToBase")}
          </WAButton>
        </Link>
      </div>

      {/* 6. Legal / Notice */}
      <div className="text-center text-wa-text/30 font-barlow text-[10px] uppercase tracking-widest leading-loose">
        {t("cancellationPolicy")}
      </div>
    </div>
  );
};
