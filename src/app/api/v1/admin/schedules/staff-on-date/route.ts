import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
  }

  // Find shifts for this date and join with users to get names
  const { data, error } = await supabaseService
    .from('staff_shifts')
    .select(`
      id,
      staff_id,
      shift_date,
      start_time,
      end_time,
      users!staff_id (
        full_name
      )
    `)
    .eq('shift_date', date);

  if (error) {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }

  // Flatten the response for easier consumption
  const flattened = data.map((shift: any) => ({
    shift_id: shift.id,
    staff_id: shift.staff_id,
    full_name: shift.users?.full_name || 'Unknown Staff',
    time: `${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}`
  }));

  return NextResponse.json(flattened);
}, "manage_financials");
