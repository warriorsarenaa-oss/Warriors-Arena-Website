import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

const StatusUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'checked_in',
    'in_progress',
    'completed',
    'no_show',
    'cancelled'
  ]),
  final_amount_paid: z.number().optional(),
  payment_method: z.string().optional(),
});

export const PATCH = requirePermission(async (request: Request, { user, params }) => {
  const { id } = params;

  try {
    const body = await request.json();
    const parsed = StatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { status, final_amount_paid, payment_method } = parsed.data;

    // Build update object
    const updateData: any = { status };

    if (status === 'checked_in') {
      updateData.checked_in_at = new Date().toISOString();
      updateData.checked_in_by = user.id;
    } else if (status === 'in_progress') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user.id;
      if (final_amount_paid !== undefined) updateData.final_amount_paid = final_amount_paid;
      if (payment_method) updateData.payment_method = payment_method;
    }

    const { data, error } = await supabaseService
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("[STATUS_UPDATE_ERROR]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ Fix: If status is cancelled or no_show, release the slots in booking_slots table
    if (status === 'cancelled' || status === 'no_show') {
      console.log(`Releasing slots for booking ${id} due to status: ${status}`);
      const { error: slotError } = await supabaseService
        .from('booking_slots')
        .update({ released: true })
        .eq('booking_id', id);
      
      if (slotError) {
        console.error("[SLOT_RELEASE_ERROR]", slotError);
        // We don't fail the request since the status was updated, 
        // but this is why future bookings might fail.
      }
    }

    // Audit Log
    await supabaseService.from("audit_logs").insert({
      action: "update_status",
      entity_type: "bookings",
      entity_id: id,
      actor_user_id: user.id,
      after_state: { status },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[STATUS_UPDATE_EXCEPTION]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "create_booking"); // Reusing create_booking permission for status updates
