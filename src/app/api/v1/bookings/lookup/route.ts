import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/db/supabase-anon";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get("phone");

    // Get IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";
    
    // Rate limit: 5 requests per minute per IP
    const rateLimit = await checkRateLimit(`lookup_${ip}`, 5, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    if (!rawPhone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Strip non-numeric
    const numericPhone = rawPhone.replace(/\D/g, "");
    
    if (numericPhone.length < 7 || numericPhone.length > 15) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Extract core 10 digits (Egyptian mobile without leading 0 or +20)
    const corePhone = numericPhone.length > 10 ? numericPhone.slice(-10) : numericPhone;
    
    // Create a fuzzy pattern to match numbers with any spaces/dashes between digits
    // Example: "1228177654" -> "%1%2%2%8%1%7%7%6%5%4%"
    const fuzzyPhone = '%' + corePhone.split('').join('%') + '%';

    // Query bookings
    const { data: bookings, error } = await supabaseAnon
      .from("bookings")
      .select(`
        booking_code,
        booking_date,
        start_time,
        end_time,
        duration_minutes,
        player_count,
        status,
        games (
          name_en,
          name_ar
        )
      `)
      .ilike('customer_phone', fuzzyPhone)
      .order("booking_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[BOOKING_LOOKUP_DB_ERROR]", error);
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    // Map response exactly to avoid leaking any data
    const formattedBookings = (bookings || []).map((b: any) => ({
      booking_code: b.booking_code,
      booking_date: b.booking_date,
      start_time: b.start_time,
      end_time: b.end_time,
      duration_minutes: b.duration_minutes,
      player_count: b.player_count,
      status: b.status,
      game_name_en: b.games?.name_en || "",
      game_name_ar: b.games?.name_ar || "",
    }));

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error("[BOOKING_LOOKUP_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
