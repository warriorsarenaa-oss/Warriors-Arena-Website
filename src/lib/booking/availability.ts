import { createSupabaseService } from "@/lib/db/supabase-service";
import { parseISO, getDay } from "date-fns";

export async function validateSlotAvailability(
  gameId: string, 
  dateStr: string, 
  startTimeHHMM: string, 
  durationMinutes: number
): Promise<{ valid: boolean, reason?: string }> {
  const supabase = createSupabaseService();
  
  // 1. Check override
  const { data: override } = await supabase
    .from("game_date_overrides")
    .select("is_available, allowed_times")
    .eq("game_id", gameId)
    .eq("override_date", dateStr)
    .single();

  let allowedTimes: string[] | null = null;
  
  if (override) {
    if (!override.is_available) return { valid: false, reason: "Day is explicitly blocked" };
    if (override.allowed_times && override.allowed_times.length === 0) return { valid: false, reason: "No time slots allowed" };
    if (override.allowed_times) allowedTimes = override.allowed_times.map((t: string) => t.substring(0, 5));
  } else {
    // 2. Check weekly protocol
    const dayOfWeek = getDay(parseISO(dateStr));
    const { data: dayConfig } = await supabase
      .from("game_day_availability")
      .select("is_available, allowed_times")
      .eq("game_id", gameId)
      .eq("day_of_week", dayOfWeek)
      .single();
      
    if (dayConfig) {
      if (!dayConfig.is_available) return { valid: false, reason: "Game is not available on this day of the week" };
      if (dayConfig.allowed_times && dayConfig.allowed_times.length === 0) return { valid: false, reason: "No time slots allowed" };
      if (dayConfig.allowed_times) allowedTimes = dayConfig.allowed_times.map((t: string) => t.substring(0, 5));
    }
  }

  // 3. Validate against allowedTimes array
  if (allowedTimes) {
    if (!allowedTimes.includes(startTimeHHMM)) return { valid: false, reason: "Start time is outside operating hours" };
    
    if (durationMinutes === 60) {
      // Calculate next 30 min slot
      const [h, m] = startTimeHHMM.split(":").map(Number);
      let mins = h * 60 + m + 30;
      const nextH = String(Math.floor(mins / 60)).padStart(2, "0");
      const nextM = String(mins % 60).padStart(2, "0");
      const nextTimeStrHHMM = `${nextH}:${nextM}`;
      
      if (!allowedTimes.includes(nextTimeStrHHMM)) return { valid: false, reason: "Booking duration exceeds operating hours" };
    }
  }

  return { valid: true };
}
