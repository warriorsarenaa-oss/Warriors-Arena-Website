/**
 * WhatsApp confirmation message builder
 * Used in booking wizard to generate pre-filled confirmation message
 */

interface BookingConfirmationData {
  game_name: string;
  game_name_ar?: string;
  booking_date: string;       // "2026-05-10"
  start_time: string;         // "18:00"
  end_time: string;           // "19:00"
  player_count: number;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  mission_name?: string | null;
  mission_additional_price?: number | null;
  locale?: 'en' | 'ar';
}

/**
 * Format date: "2026-05-10" → "10 May 2026"
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format time: "18:00:00" → "6:00 PM"
 */
function formatTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
}

/**
 * Build the pre-filled WhatsApp confirmation message
 * Customer sends this to admin to confirm their booking
 */
export function buildWhatsAppConfirmationMessage(data: BookingConfirmationData): string {
  const lines: string[] = [
    '🚀 Booking Confirmation — Warriors Arena',
    '',
    `🎮 Game: ${data.game_name}`,
    `📅 Date: ${formatDate(data.booking_date)}`,
    `⏰ Time: ${formatTime(data.start_time)} — ${formatTime(data.end_time)}`,
    `👥 Players: ${data.player_count}`,
  ];

  if (data.mission_name) {
    lines.push(`🚀 Mission: ${data.mission_name}`);
  }

  lines.push(`💰 Total: ${data.total_amount} EGP`);
  lines.push('');
  lines.push(`👤 Name: ${data.customer_name || 'Not provided'}`);
  lines.push(`📱 Phone: ${data.customer_phone || 'Not provided'}`);
  lines.push('');
  lines.push('Please confirm my booking and send deposit instructions. 🙏');

  return lines.join('\n');
}

/**
 * Generate the WhatsApp deep link URL
 * Opens WhatsApp with pre-filled message to admin number
 */
export function buildWhatsAppLink(message: string): string {
  const rawAdminPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "201226557592";
  
  // Strip all non-digits to ensure the link works (no +, no spaces)
  const cleanAdminPhone = rawAdminPhone.replace(/\D/g, '');

  // Using api.whatsapp.com/send is more universal than wa.me in some environments
  return `https://api.whatsapp.com/send?phone=${cleanAdminPhone}&text=${encodeURIComponent(message)}`;
}
