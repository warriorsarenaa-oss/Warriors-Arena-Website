import { NextResponse } from "next/server";
import { createSupabaseService } from "@/lib/db/supabase-service";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { formatCairoDate, cairoNow } from "@/lib/time/cairo";
import { checkRateLimit } from "@/lib/rate-limit";
import { isBefore, addDays, parseISO, isValid } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const CAIRO_TZ = "Africa/Cairo";

/**
 * PUBLIC AVAILABILITY API
 *
 * Returns the occupation status for every 30-minute slot on a given date.
 * Computes availability directly via supabaseService (service role) so that
 * it works regardless of whether fn_get_availability has been deployed to the
 * Supabase instance. Replicates the exact logic from fn_get_availability.sql.
 *
 * Response shape per slot:
 *   { slot_time: "HH:MM:SS", available_30: boolean, available_60: boolean, reason: string|null }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const gameId = searchParams.get("game_id");
  const isAdmin = searchParams.get("admin") === "true";

  // 1. Rate Limiting: 60/min per IP
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { allowed } = await checkRateLimit(`avail_${ip}`, 60, 60);

  if (!allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests" } },
      { status: 429 }
    );
  }

  // 2. Validation
  if (!dateStr) {
    return NextResponse.json(
      { error: { code: "MISSING_DATE", message: "Date parameter is required" } },
      { status: 400 }
    );
  }

  const requestedDate = parseISO(dateStr);
  if (!isValid(requestedDate)) {
    return NextResponse.json(
      { error: { code: "INVALID_DATE", message: "Invalid date format. Use YYYY-MM-DD" } },
      { status: 400 }
    );
  }

  const todayStr = formatCairoDate(cairoNow());
  const maxDate = addDays(parseISO(todayStr), 90);

  if (!isAdmin && isBefore(requestedDate, parseISO(todayStr))) {
    return NextResponse.json(
      { error: { code: "DATE_IN_PAST", message: "Cannot check availability for past dates" } },
      { status: 400 }
    );
  }

  if (requestedDate > maxDate) {
    return NextResponse.json(
      { error: { code: "DATE_TOO_FAR", message: "Availability only available for the next 90 days" } },
      { status: 400 }
    );
  }

  // 3. Resolve operating hours for the requested date.
  //    Priority: exact_date > day_of_week > default  (mirrors fn_resolve_operating_hours)
  const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, matches PostgreSQL EXTRACT(DOW)

  const supabase = createSupabaseService();
  const { data: hoursRows, error: hoursError } = await supabase
    .from("operating_hours")
    .select("scope, open_time, close_time, is_closed, exact_date, day_of_week")
    .in("scope", ["exact_date", "day_of_week", "default"]);

  if (hoursError) {
    console.error("[availability] operating_hours query failed:", hoursError);
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "Failed to load operating hours" } },
      { status: 500 }
    );
  }

  // Resolve by priority
  let resolvedHours: { open_time: string; close_time: string; is_closed: boolean } | null = null;

  // Priority 1: exact date match
  const exactMatch = (hoursRows ?? []).find(
    (r) => r.scope === "exact_date" && r.exact_date === dateStr
  );
  if (exactMatch) {
    resolvedHours = exactMatch;
  }

  // Priority 2: day of week
  if (!resolvedHours) {
    const dowMatch = (hoursRows ?? []).find(
      (r) => r.scope === "day_of_week" && r.day_of_week === dayOfWeek
    );
    if (dowMatch) resolvedHours = dowMatch;
  }

  // Priority 3: default
  if (!resolvedHours) {
    const defaultMatch = (hoursRows ?? []).find((r) => r.scope === "default");
    if (defaultMatch) resolvedHours = defaultMatch;
  }

  // Closed day or no config → return empty array (no slots)
  if (!resolvedHours || resolvedHours.is_closed || !resolvedHours.open_time || !resolvedHours.close_time) {
    return NextResponse.json([]);
  }

  // Fetch game-specific hour bounds if a game_id was provided
  let gameOpenMins = -1;
  let gameCloseMins = 9999;
  
  if (gameId) {
    const { data: override } = await supabase
      .from("game_date_overrides")
      .select("is_available, start_time, end_time")
      .eq("game_id", gameId)
      .eq("override_date", dateStr)
      .single();

    if (override && !override.is_available) {
      return NextResponse.json([]); // Game not available today at all
    }
    
    if (override && override.start_time && override.end_time) {
      const toMinutes = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      gameOpenMins = toMinutes(override.start_time);
      gameCloseMins = toMinutes(override.end_time);
    } else {
      const { data: dayConfig } = await supabase
        .from("game_day_availability")
        .select("is_available, start_time, end_time")
        .eq("game_id", gameId)
        .eq("day_of_week", dayOfWeek)
        .single();
        
      if (dayConfig && !dayConfig.is_available) {
        return NextResponse.json([]); // Game not available today at all
      }
      
      if (dayConfig && dayConfig.start_time && dayConfig.end_time) {
        const toMinutes = (t: string) => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };
        gameOpenMins = toMinutes(dayConfig.start_time);
        gameCloseMins = toMinutes(dayConfig.end_time);
      }
    }
  }

  // 4. Load ALL existing bookings for this date (CRITICAL FIX)
  const { data: allBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, booking_code, start_time, duration_minutes, status, customer_name, occupied_slots")
    .eq("booking_date", dateStr)
    .in("status", ["confirmed", "pending", "checked_in", "in_progress", "completed"]);

  if (bookingsError) {
    console.error("[availability] direct bookings query failed:", bookingsError);
  }

  if (allBookings && allBookings.length > 0) {
    allBookings.forEach(b => {
    });
  }

  // 5. Generate availability for each 30-min slot between open and close.
  const nowUtc = new Date();

  const toMinutes = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const fromMinutes = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  };

  const openMins  = toMinutes(resolvedHours.open_time);
  const closeMins = toMinutes(resolvedHours.close_time);

  const slots: any[] = [];

  // Helper to check if a specific time is covered by ANY booking
  const isTimeCovered = (timeStr: string) => {
    if (!allBookings) return { covered: false, bookings: [] };
    const targetMins = toMinutes(timeStr);
    const targetShort = timeStr.substring(0, 5); // "HH:MM"
    
    const coveringBookings = allBookings.filter(b => {
      // ✅ Fix: Only use occupied_slots if it's an array with CONTENT
      if ((b as any).occupied_slots && Array.isArray((b as any).occupied_slots) && (b as any).occupied_slots.length > 0) {
        return (b as any).occupied_slots.some((s: string) => s === timeStr || s === targetShort);
      }

      // Fallback: Use start_time and duration (essential for old bookings)
      if (!b.start_time) return false;
      const bStartMins = toMinutes(b.start_time);
      const bDuration = b.duration_minutes || 30;
      const bEndMins = bStartMins + bDuration;
      
      return targetMins >= bStartMins && targetMins < bEndMins;
    });

    return {
      covered: coveringBookings.length > 0,
      bookings: coveringBookings
    };
  };

  for (let mins = openMins; mins < closeMins; mins += 30) {
    const slotTime = fromMinutes(mins);
    const nextSlotTime = fromMinutes(mins + 30);

    const { covered: isBooked, bookings: bookingsForSlot } = isTimeCovered(slotTime);
    const { covered: nextBooked } = isTimeCovered(nextSlotTime);

    // Is this slot in the past?
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    const slotUtc = fromZonedTime(`${dateStr}T${hh}:${mm}:00`, CAIRO_TZ);
    const isPast = isAdmin ? false : slotUtc <= nowUtc;

    // Check if slot falls outside the game-specific operating hours
    const isOutsideGameHours = gameId ? (mins < gameOpenMins || (mins + 30) > gameCloseMins) : false;
    const isOutsideGameHoursNext = gameId ? (mins < gameOpenMins || (mins + 60) > gameCloseMins) : false;

    const available30 = !isBooked && !isPast && !isOutsideGameHours;
    const available60 = !isBooked && !nextBooked && (mins + 60) <= closeMins && !isPast && !isOutsideGameHoursNext;

    let reason: string | null = null;
    if (isOutsideGameHours) reason = "game_closed";
    else if (isPast) reason = "past";
    else if (isBooked) reason = "booked";
    else if ((mins + 60) > closeMins) reason = "closing";

    if (isBooked) {
    }

    slots.push({
      slot_time: slotTime,
      start_time: slotTime, // Added for compatibility with user's new frontend code
      is_booked: isBooked, // Added explicit boolean
      available_30: available30,
      available_60: available60,
      reason,
      bookings: bookingsForSlot.map(b => ({
        code: b.booking_code,
        status: b.status,
        customer: b.customer_name,
      })),
    });
  }

  return NextResponse.json({
    date: dateStr,
    slots,
    venue_status: "operational"
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    }
  });
}
