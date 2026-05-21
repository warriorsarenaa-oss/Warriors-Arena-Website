import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { emitEvent } from "@/lib/events/eventBus";

export const POST = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;

  // 1. Fetch current booking state
  const { data: booking, error: fetchError } = await supabaseService
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status !== 'completed') {
    return NextResponse.json({ error: "Only 'completed' bookings can be undone." }, { status: 400 });
  }

  // 2. Wrap the update in a transaction via a stored procedure OR handle sequentially safely
  // We'll update the booking status to 'confirmed' (its standard pre-completed state)
  const { data: updatedBooking, error: updateError } = await supabaseService
    .from('bookings')
    .update({
      status: 'confirmed',
      completed_at: null,
      completed_by: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 3. Log the Undo action explicitly
  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: "UNDO_BOOKING_COMPLETION",
    entity_type: "booking",
    entity_id: id,
    before_state: booking,
    after_state: updatedBooking
  });

  // 4. Emit the BOOKING_UNDONE event to trigger cascading financial & payroll updates
  await emitEvent(
    'BOOKING_UNDONE',
    'booking',
    id,
    { oldState: booking, newState: updatedBooking },
    user.id
  );

  return NextResponse.json({ success: true, booking: updatedBooking });
}, "manage_reservations");
