import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";

export const POST = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;

  try {
    console.log('=== CONFIRM DEPOSIT ===');
    console.log('Identifier:', id);

    // 1. Robust lookup (Try UUID, then code)
    let { data: booking, error: findError } = await supabaseService
      .from('bookings')
      .select('id, booking_code')
      .eq('id', id)
      .maybeSingle();

    if (!booking && !findError) {
      const { data: bookingByCode, error: codeError } = await supabaseService
        .from('bookings')
        .select('id, booking_code')
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
        status: 'confirmed',
        deposit_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .select()
      .single();

    if (error) {
      console.error("[CONFIRM_DEPOSIT_ERROR]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit Log
    await logAuditAction({
      request,
      actor_user_id: user.id,
      actor_email: user.email,
      action: "confirm_deposit",
      entity_type: "bookings",
      entity_id: booking.booking_code,
      after_state: { status: 'confirmed', deposit_status: 'paid' }
    });

    return NextResponse.json({ success: true, booking: data });
  } catch (error: any) {
    console.error("[CONFIRM_DEPOSIT_EXCEPTION]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "create_booking");
