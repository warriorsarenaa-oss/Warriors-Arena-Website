import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";

export const POST = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;

  try {
    const body = await request.json();
    const { final_amount_paid, payment_method } = body;

    console.log('=== COMPLETE BOOKING ===');
    console.log('Identifier:', id);

    // 1. Robust lookup (Try UUID, then code)
    let { data: booking, error: findError } = await supabaseService
      .from('bookings')
      .select('id, booking_code, total_price_at_booking')
      .eq('id', id)
      .maybeSingle();

    if (!booking && !findError) {
      const { data: bookingByCode, error: codeError } = await supabaseService
        .from('bookings')
        .select('id, booking_code, total_price_at_booking')
        .eq('booking_code', id)
        .maybeSingle();
      booking = bookingByCode;
      findError = codeError;
    }

    if (findError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 2. Perform update by UUID
    const { data, error } = await supabaseService
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit Log
    await logAuditAction({
      request,
      actor_user_id: user.id,
      actor_email: user.email,
      action: "complete_booking",
      entity_type: "bookings",
      entity_id: booking.booking_code,
      after_state: { status: 'completed', final_amount_paid }
    });

    return NextResponse.json({ success: true, booking: data });
  } catch (error: any) {
    console.error("[COMPLETE_BOOKING_EXCEPTION]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "create_booking");
