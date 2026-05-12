import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";

export const POST = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;

  try {
    const body = await request.json();
    const { final_amount_paid, payment_method, lead_staff_id } = body;

    // 1. Robust lookup (Try UUID, then code)
    let { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select('id, booking_code, booking_date, start_time, status, total_price_at_booking')
      .eq('id', id)
      .maybeSingle();

    if (!booking && !bookingError) {
      const { data: bookingByCode, error: codeError } = await supabaseService
        .from('bookings')
        .select('id, booking_code, booking_date, start_time, status, total_price_at_booking')
        .eq('booking_code', id)
        .maybeSingle();
      booking = bookingByCode;
      bookingError = codeError;
    }

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 2. Perform update by UUID
    const { data: updated, error } = await supabaseService
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        final_amount_paid: final_amount_paid,
        payment_method: payment_method || 'cash',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .select()
      .single();

    if (error) {
      console.error("[COMPLETE_BOOKING_ERROR]", error);
      return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }

    // Audit Log
    await logAuditAction({
      request,
      actor_user_id: user.id,
      actor_email: user.email,
      action: "complete_booking",
      after_state: { status: 'completed', final_amount_paid },
      entity_id: booking.booking_code,
      entity_type: "bookings",
    });

    // 3. Log to staff shift for commission (Automated + Revenue-Based)
    try {
      const bookingDate = updated.booking_date;
      const bookingTime = updated.start_time;

      // Determine target staff: either lead provided or auto-detect from shift
      let targetStaffIds = (lead_staff_id && lead_staff_id !== "") ? [lead_staff_id] : [];

      if (targetStaffIds.length === 0) {
        const { data: shiftsOnDate } = await supabaseService
          .from('staff_shifts')
          .select('staff_id, start_time, end_time')
          .eq('shift_date', bookingDate);

        if (shiftsOnDate && shiftsOnDate.length > 0) {
          const normalizedBookingTime = bookingTime?.slice(0, 5);
          targetStaffIds = shiftsOnDate
            .filter(s => {
              const sStart = s.start_time?.slice(0, 5);
              const sEnd = s.end_time?.slice(0, 5);
              return sStart <= normalizedBookingTime && sEnd > normalizedBookingTime;
            })
            .map(s => s.staff_id);
        }
      }

      if (targetStaffIds.length > 0) {
        // Split revenue equally between all active staff
        const splitRevenue = (updated.final_amount_paid || 0) / targetStaffIds.length;

        for (const staffId of targetStaffIds) {
          // Fetch current commission rate for accurate historical logging
          const { data: staffUser } = await supabaseService
            .from('users')
            .select('commission_rate')
            .eq('id', staffId)
            .single();

          const rate = staffUser?.commission_rate || 0;
          const commissionAmount = (splitRevenue * rate) / 100;

          const { data: activeShift } = await supabaseService
            .from('staff_shifts')
            .select('id')
            .eq('staff_id', staffId)
            .eq('shift_date', bookingDate)
            .maybeSingle();

          if (activeShift) {
            await supabaseService.from('shift_game_log').insert({
              shift_id: activeShift.id,
              booking_id: booking.id,
              booking_code: booking.booking_code,
              game_name: updated.game_name || 'Game',
              game_completed_at: new Date().toISOString(),
              game_revenue: splitRevenue,
              commission_amount: commissionAmount, // Required by DB
            });
          }
        }
      }
    } catch (shiftErr) {
      console.error("[SHIFT_LOG_ERROR] Non-critical:", shiftErr);
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("[COMPLETE_BOOKING_EXCEPTION]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "create_booking");
