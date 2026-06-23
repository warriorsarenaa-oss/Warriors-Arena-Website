import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { roundEGP } from "@/lib/utils/format";

export const POST = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;

  try {
    const body = await request.json();
    const { final_amount_paid, payment_method, lead_staff_ids, discount_amount, discount_type, discount_value } = body;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let booking = null;
    let bookingError = null;

    const selectFields = 'id, booking_code, booking_date, start_time, status, total_price_at_booking';

    if (isUuid) {
      const res = await supabaseService.from('bookings').select(selectFields).eq('id', id).maybeSingle();
      booking = res.data;
      bookingError = res.error;
    } else {
      const res = await supabaseService.from('bookings').select(selectFields).eq('booking_code', id).maybeSingle();
      booking = res.data;
      bookingError = res.error;
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
        ...(discount_amount !== undefined ? { discount_amount, discount_type, discount_value } : {}),
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
      const fullRevenue = Number(updated.final_amount_paid || 0);

      // Explicit multi-staff selection: each selected staff gets FULL commission (not split)
      const explicitStaffIds = Array.isArray(lead_staff_ids)
        ? lead_staff_ids.filter(Boolean)
        : [];
      const isManualAssignment = explicitStaffIds.length > 0;

      let targetStaffIds: string[] = explicitStaffIds;

      if (!isManualAssignment) {
        // Auto-detect: find all staff whose shift covers this booking's start_time
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
              return sStart && sEnd && sStart <= normalizedBookingTime && sEnd > normalizedBookingTime;
            })
            .map(s => s.staff_id);
        }
      }

      if (targetStaffIds.length > 0) {
        // Every staff member — whether auto-detected or manually selected — receives
        // commission on the FULL booking revenue independently (no split between workers)
        for (const staffId of targetStaffIds) {
          const { data: staffUser } = await supabaseService
            .from('users')
            .select('commission_rate')
            .eq('id', staffId)
            .single();

          const rate = staffUser?.commission_rate || 0;
          const commissionAmount = roundEGP((fullRevenue * rate) / 100);

          const { data: activeShift } = await supabaseService
            .from('staff_shifts')
            .select('id')
            .eq('staff_id', staffId)
            .eq('shift_date', bookingDate)
            .maybeSingle();

          if (activeShift) {
            // Guard: per (booking_id, shift_id) — prevents duplicates on re-complete and
            // correctly handles multiple staff receiving separate commission records
            const { data: existingLog } = await supabaseService
              .from('shift_game_log')
              .select('id')
              .eq('booking_id', booking.id)
              .eq('shift_id', activeShift.id)
              .maybeSingle();

            if (!existingLog) {
              await supabaseService.from('shift_game_log').insert({
                shift_id: activeShift.id,
                booking_id: booking.id,
                booking_code: booking.booking_code,
                game_name: updated.game_name || 'Game',
                game_completed_at: new Date().toISOString(),
                game_revenue: fullRevenue,
                commission_amount: commissionAmount,
                commission_source: isManualAssignment ? 'manual' : 'realtime',
              });
            } else {
              console.log(`[SHIFT_LOG] Entry already exists for booking ${booking.booking_code} / shift ${activeShift.id} — skipping duplicate.`);
            }
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
