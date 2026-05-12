import { formatCairoTime } from "@/lib/time/cairo";

/**
 * WHATSAPP DEEP LINK HELPER
 * 
 * Generates a pre-filled WhatsApp message for booking confirmations.
 */

interface WhatsAppLinkParams {
  phone: string;
  customerName: string;
  bookingCode: string;
  gameName: string;
  date: string;
  startTime: string;
  totalPrice: number;
  playerCount: number;
  depositAmount: number;
  missionName?: string | null;
}

export function generateWhatsAppLink(params: WhatsAppLinkParams): string {
  const businessPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201226557592";
  
  const fullMessage = 
    `Hi! I've just booked a session at Warriors Arena.\n\n` +
    `Booking Code: ${params.bookingCode}\n` +
    `Date: ${params.date}\n` +
    `Time: ${formatCairoTime(params.startTime)}\n` +
    `Game: ${params.gameName}\n` +
    `Players: ${params.playerCount}\n` +
    (params.missionName ? `Mission: ${params.missionName}\n` : "") +
    `Total: ${params.totalPrice} EGP\n` +
    (params.depositAmount > 0 
      ? `Deposit Required: ${params.depositAmount} EGP\n\nI'd like to confirm my booking and pay the deposit.`
      : "\nI'd like to confirm my booking. The total will be paid on arrival.");
  
  const encodedMessage = encodeURIComponent(fullMessage);
  
  // Clean phone number: remove + if present
  const cleanPhone = businessPhone.replace(/\+/g, "");
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
