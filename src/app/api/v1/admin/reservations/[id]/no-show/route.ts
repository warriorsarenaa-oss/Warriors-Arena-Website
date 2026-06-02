import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";

export const POST = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;

  try {

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let booking = null;
    let findError = null;

    if (isUuid) {
      const res = await supabaseService.from('bookings').select('id, booking_code').eq('id', id).maybeSingle();
      booking = res.data;
      findError = res.error;
    } else {
      const res = await supabaseService.from('bookings').select('id, booking_code').eq('booking_code', id).maybeSingle();
      booking = res.data;
      findError = res.error;
    }

    if (findError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 2. Perform update by UUID
    const { data, error } = await supabaseService
      .from('bookings')
      .update({
        status: 'no_show',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .select()
      .single();

    if (error) {
      console.error("[NO_SHOW_ERROR]", error);
      return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }

    // Release slots
    await supabaseService
      .from('booking_slots')
      .update({ released: true })
      .eq('booking_id', booking.id);

    // Audit Log
    await logAuditAction({
      request,
      actor_user_id: user.id,
      actor_email: user.email,
      action: "mark_no_show",
      entity_type: "bookings",
      entity_id: booking.booking_code,
      after_state: { status: 'no_show' }
    });

    return NextResponse.json({ success: true, booking: data });
  } catch (error) {
    console.error("[NO_SHOW_EXCEPTION]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "create_booking");
