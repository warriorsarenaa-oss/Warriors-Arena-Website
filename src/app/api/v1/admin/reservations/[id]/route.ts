import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async (request: Request, { params }) => {
  const { id } = await params;

  try {
    // 1. Try UUID, then booking_code
    let { data: booking, error } = await supabaseService
      .from('bookings')
      .select(`
        *,
        games (name_en, slug),
        special_missions (name_en),
        booking_refills (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (!booking && !error) {
      const { data: bookingByCode, error: codeError } = await supabaseService
        .from('bookings')
        .select(`
          *,
          games (name_en, slug),
          special_missions (name_en),
          booking_refills (*)
        `)
        .eq('booking_code', id)
        .maybeSingle();
      booking = bookingByCode;
      error = codeError;
    }

    if (error) throw error;
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Map booking_refills to refills for consistency
    const result = {
      ...booking,
      refills: booking.booking_refills || []
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET_BOOKING_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "view_bookings");
