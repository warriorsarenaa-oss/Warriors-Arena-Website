import { Resend } from "resend";

export interface BookingEmailData {
  bookingCode: string;
  gameName: string;
  bookingDate: string;
  startTime: string;
  endTime?: string;
  playerCount: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  specialMission?: string | null;
  staffEmail?: string | null;
}

export const sendAdminBookingNotification = async (data: BookingEmailData): Promise<void> => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey || !fromEmail || !adminEmail) {
      console.warn("[EMAIL_WARN] Missing Resend environment variables. Email not sent.");
      return;
    }

    // Build recipient list: always super admin + staff if available
    const recipients: string[] = [adminEmail];
    
    if (data.staffEmail && data.staffEmail !== adminEmail) {
      recipients.push(data.staffEmail);
    }

    const resend = new Resend(apiKey);

    const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #2E4036;">New Booking Confirmation</h2>
          <table style="width: 100%; max-width: 600px; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Booking Code:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.bookingCode}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Customer Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.customerName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Customer Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.customerPhone}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Game:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.gameName}</td></tr>
            ${data.specialMission ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Mission:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.specialMission}</td></tr>` : ''}
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.bookingDate}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Start Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.startTime}</td></tr>
            ${data.endTime ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>End Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.endTime}</td></tr>` : ''}
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Players:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.playerCount}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.totalAmount} EGP</td></tr>
          </table>
        </div>
      `;

    await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: `New Booking Confirmed: ${data.bookingCode}`,
      html: emailHtml,
    });
    
    console.log(`[EMAIL] Notification sent to: ${recipients.join(', ')}`);

  } catch (error) {
    console.error("[RESEND_ERROR] Failed to send admin notification email:", error);
  }
};
