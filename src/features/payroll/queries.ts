import { supabaseService } from "@/lib/db/supabase-service";

export interface CommissionBreakdownItem {
  id: string;
  booking_code: string;
  game_name: string;
  commission_amount: number;
  commission_source: string;
  booking_date: string;
  start_time: string;
}

export async function getCommissionBreakdown(
  staffId: string,
  weekStart: string,
  weekEnd: string
): Promise<CommissionBreakdownItem[]> {
  const { data: shifts } = await supabaseService
    .from("staff_shifts")
    .select("id")
    .eq("staff_id", staffId)
    .gte("shift_date", weekStart)
    .lte("shift_date", weekEnd);

  const shiftIds = shifts?.map((s) => s.id) ?? [];
  if (shiftIds.length === 0) return [];

  const { data: logs, error } = await supabaseService
    .from("shift_game_log")
    .select(`
      id,
      booking_code,
      game_name,
      commission_amount,
      commission_source,
      game_completed_at,
      bookings!booking_id (
        booking_date,
        start_time
      )
    `)
    .in("shift_id", shiftIds)
    .order("game_completed_at", { ascending: true });

  if (error) {
    console.error("[COMMISSION_BREAKDOWN_QUERY_ERROR]", error);
    throw error;
  }

  return (logs ?? []).map((log) => {
    const booking = (log as any).bookings as { booking_date: string; start_time: string } | null;
    return {
      id: log.id,
      booking_code: log.booking_code ?? "—",
      game_name: log.game_name ?? "Game",
      commission_amount: Number(log.commission_amount ?? 0),
      commission_source: (log as any).commission_source ?? "realtime",
      booking_date: booking?.booking_date ?? "",
      start_time: booking?.start_time ?? "",
    };
  });
}
