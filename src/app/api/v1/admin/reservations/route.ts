import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

const EGYPT_PHONE_REGEX = /^(\+20|0)?1[0125][0-9]{8}$/;

const AdminBookingSchema = z.object({
  game_id: z.string().uuid(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string(), // "18:00:00"
  duration_minutes: z.union([z.literal(30), z.literal(60)]),
  player_count: z.number().int().min(1).max(50), // Admin can override up to 50
  customer_name: z.string().min(2).max(100).trim(),
  customer_phone: z.string().regex(EGYPT_PHONE_REGEX, "Invalid Egyptian phone number"),
  customer_email: z.string().email().optional().or(z.literal("")),
  customer_notes: z.string().max(500).optional(),
  special_mission_id: z.string().uuid().optional().nullable(),
  discount_type: z.union([z.literal('percentage'), z.literal('flat')]).nullable().optional(),
  discount_value: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  total_price_at_booking: z.number().min(0).optional(),
});

function calculateOccupiedSlots(startTime: string, durationMinutes: number): string[] {
  const slots: string[] = [];
  const [h, m] = startTime.split(':').map(Number);
  
  let currentH = h;
  let currentM = m;
  let remaining = durationMinutes;
  
  while (remaining > 0) {
    const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}:00`;
    slots.push(timeStr);
    currentM += 30;
    if (currentM >= 60) {
      currentM = 0;
      currentH += 1;
    }
    remaining -= 30;
  }
  return slots;
}

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const parsed = AdminBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    
    // ✅ Calculate total duration including mission bonus
    let totalDuration = data.duration_minutes;
    if (data.special_mission_id) {
      const { data: mission } = await supabaseService
        .from("special_missions")
        .select("duration_bonus_minutes")
        .eq("id", data.special_mission_id)
        .single();
      
      if (mission?.duration_bonus_minutes) {
        totalDuration += mission.duration_bonus_minutes;
      }
    }

    const requestedSlots = calculateOccupiedSlots(data.start_time, totalDuration);

    // ✅ CRITICAL PRE-CHECK: Prevent double bookings across ALL occupied slots
    
    // Check if any booking occupies these slots
    const { data: existingBookings, error: checkError } = await supabaseService
      .from("bookings")
      .select("id, booking_code, status, customer_name, occupied_slots, start_time, duration_minutes")
      .eq("booking_date", data.booking_date)
      .in("status", ["confirmed", "pending", "checked_in", "in_progress", "completed"]);

    if (checkError) {
      console.error("[BOOKING_PRE_CHECK_ERROR]", checkError);
      return NextResponse.json(
        { error: "Failed to verify slot availability", details: checkError.message },
        { status: 500 }
      );
    }

    // Manual overlap check since we might not have the GIN index yet
    const conflicts = existingBookings?.filter(b => {
      // ✅ Fix: Only trust occupied_slots if it has data
      if (b.occupied_slots && Array.isArray(b.occupied_slots) && b.occupied_slots.length > 0) {
        return b.occupied_slots.some((s: string) => requestedSlots.includes(s) || requestedSlots.includes(s.substring(0, 5)));
      }
      // Fallback: check if start_time/duration overlaps
      const bSlots = calculateOccupiedSlots(b.start_time, b.duration_minutes || 30);
      return bSlots.some(s => requestedSlots.includes(s));
    });

    if (conflicts && conflicts.length > 0) {
      console.error("❌ SLOT CONFLICT DETECTED:");
      conflicts.forEach(b => {
        console.error(`  - ${b.booking_code} (${b.status}) - ${b.customer_name}`);
      });

      return NextResponse.json(
        { 
          error: "SLOT_CONFLICT", 
          message: "One or more of the requested time slots are already booked",
          conflicts: conflicts.map(b => b.booking_code),
          existing_bookings: conflicts.map(b => ({
            code: b.booking_code,
            customer: b.customer_name,
            status: b.status,
          }))
        },
        { status: 409 }
      );
    }
    

    // Call the fn_create_booking RPC
    const { data: bookingResult, error: rpcError } = await supabaseService.rpc(
      "fn_create_booking",
      {
        p_game_id: data.game_id,
        p_bundle_id: null,
        p_date: data.booking_date,
        p_start_time: data.start_time,
        p_duration_minutes: data.duration_minutes,
        p_player_count: data.player_count,
        p_customer_name: data.customer_name,
        p_customer_phone: data.customer_phone,
        p_customer_email: data.customer_email || null,
        p_customer_notes: data.customer_notes || null,
        p_source: "manual",
        p_created_by_user_id: user.id,
        p_special_mission_id: data.special_mission_id || null
      }
    ).single();

    if (rpcError) {
      console.error("[ADMIN_BOOKING_ERROR]", rpcError);
      if (rpcError.message.includes("SLOT_CONFLICT")) {
        return NextResponse.json({ error: "SLOT_CONFLICT", message: "Slot already taken" }, { status: 409 });
      }
      return NextResponse.json({ error: "Internal Error", message: rpcError.message }, { status: 500 });
    }

    // Type definition for the RPC return value
    type BookingResult = {
      booking_id: string;
      booking_code: string;
      total_price: number;
      deposit_amount: number;
      end_time: string;
      commission_amount: number | null;
    };

    const booking = bookingResult as BookingResult;

    // ✅ New: Populate occupied_slots after creation
    // This ensures multi-slot blocking works even before the RPC is updated
    const postCreateUpdate: any = { occupied_slots: requestedSlots };
    if (data.discount_amount !== undefined && data.discount_amount > 0) {
      postCreateUpdate.discount_type = data.discount_type;
      postCreateUpdate.discount_value = data.discount_value;
      postCreateUpdate.discount_amount = data.discount_amount;
      postCreateUpdate.total_price_at_booking = data.total_price_at_booking;
    }

    await supabaseService
      .from("bookings")
      .update(postCreateUpdate)
      .eq("id", booking.booking_id);

    // Since RPC is atomic, the audit log should ideally be inside the RPC.
    // However, if the RPC doesn't log it, we log it here.
    // Based on Phase 1 specs, we log it from the API to easily capture IP/User-Agent
    await supabaseService.from("audit_logs").insert({
      action: "create_booking",
      entity_type: "bookings",
      entity_id: booking.booking_id,
      actor_user_id: user.id,
      after_state: { ...data, booking_code: booking.booking_code },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_BOOKING_EXCEPTION]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "create_booking");

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const { data: bookings, error } = await supabaseService
      .from('bookings')
      .select(`
        id,
        booking_code,
        status,
        booking_date,
        start_time,
        duration_minutes,
        player_count,
        customer_name,
        customer_phone,
        total_price_at_booking,
        discount_amount,
        deposit_amount,
        deposit_status,
        occupied_slots,
        ammo_package,
        refills,
        total_refill_cost,
        mission_additional_price,
        special_mission_id,
        games ( id, name_en, slug ),
        special_missions ( id, name_en )
      `)
      .eq('booking_date', dateStr)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Transform to include game_name at top level
    const transformedBookings = (bookings || []).map(b => ({
      ...b,
      game_name: (b.games as any)?.name_en || 'Unknown Game',
    }));

    return NextResponse.json(transformedBookings);
  } catch (error) {
    console.error("[ADMIN_RESERVATIONS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_bookings");
