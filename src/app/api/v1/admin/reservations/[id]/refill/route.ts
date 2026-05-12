import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { logAuditAction } from "@/lib/admin/audit-log";
import { z } from "zod";

const RefillSchema = z.object({
  player_count: z.number().int().min(1),
  ammo_per_player: z.number().int().default(400),
  price_per_player: z.number().min(0).default(50),
});

export const POST = requirePermission(async (
  request: Request,
  { user, params }: { user: any, params: { id: string } }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = RefillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { player_count, ammo_per_player, price_per_player } = parsed.data;
    const total_cost = player_count * price_per_player;

    // 1. Get current booking
    const { data: booking, error: fetchError } = await supabaseService
      .from("bookings")
      .select("*, games(slug, name_en)")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 2. Validate it's Gel Blasters
    if (!booking.games?.slug?.includes("gel")) {
      return NextResponse.json({ error: "Refills are only allowed for Gel Blasters" }, { status: 400 });
    }

    // 3. Start Transaction-like process (sequential inserts/updates)
    // Add to booking_refills
    const { data: refill, error: refillError } = await supabaseService
      .from("booking_refills")
      .insert({
        booking_id: id,
        booking_code: booking.booking_code,
        player_count,
        ammo_per_player,
        price_per_player,
        total_cost,
        added_by: user.id
      })
      .select()
      .single();

    if (refillError) throw refillError;

    // 4. Update booking totals
    const currentRefills = booking.refills || [];
    const updatedRefills = [...currentRefills, refill];
    const updatedTotalRefillCost = (Number(booking.total_refill_cost) || 0) + total_cost;

    const { error: updateError } = await supabaseService
      .from("bookings")
      .update({
        refills: updatedRefills,
        total_refill_cost: updatedTotalRefillCost,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // 5. Audit log
    await logAuditAction({
      actor_user_id: user.id,
      actor_email: user.email,
      action: "add_refill",
      entity_type: "bookings",
      entity_id: id,
      after_state: { refill_id: refill.id, total_refill_cost: updatedTotalRefillCost },
      request,
    });

    return NextResponse.json({ 
      success: true, 
      refill, 
      total_refill_cost: updatedTotalRefillCost 
    });

  } catch (error) {
    console.error("[ADMIN_REFILL_POST_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "create_booking");
