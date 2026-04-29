import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/db/supabase-anon";

/**
 * PUBLIC BOOKING LOOKUP
 * 
 * Allows customers to check their booking status using their unique code.
 * Requires the last 4 digits of their phone number as a second factor.
 * 
 * Security: Returns 404 for all failures (wrong code, wrong phone) to 
 * prevent enumeration of valid booking codes.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { searchParams } = new URL(request.url);
  const phoneLast4 = searchParams.get("phone_last4");
  const { code } = await params;

  if (!phoneLast4 || phoneLast4.length !== 4) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Booking not found" } },
      { status: 404 }
    );
  }

  // Fetch only necessary public fields
  const { data, error } = await supabaseAnon
    .from("bookings")
    .select(`
      booking_code,
      slot_date,
      slot_time,
      status,
      player_count,
      customer_phone,
      games (name_en, name_ar)
    `)
    .eq("booking_code", code)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Booking not found" } },
      { status: 404 }
    );
  }

  // Verify Phone Last 4
  // We remove non-digits before check to be robust
  const storedPhone = data.customer_phone.replace(/\D/g, "");
  const storedLast4 = storedPhone.slice(-4);

  if (storedLast4 !== phoneLast4) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Booking not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    code: data.booking_code,
    date: data.slot_date,
    time: data.slot_time,
    status: data.status,
    player_count: data.player_count,
    game: (data.games as any)?.name_en || "Game",
    deposit_instructions: "Please send confirmation via WhatsApp to confirm your slot.",
    park_fee: "Ticket excludes park entrance fees (charged separately by the venue)."
  });
}
