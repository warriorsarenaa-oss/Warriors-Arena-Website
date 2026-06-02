import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

export const GET = requirePermission(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get('week_start');

  try {
    const { data: shifts, error } = await supabaseService
      .from('staff_shifts')
      .select('*, staff:users(username)')
      .eq('shift_date', weekStart); // Simplification: get shifts for specific date or range
      
    // Better: Get shifts for the week
    if (weekStart) {
        const { data: weekShifts, error: weekError } = await supabaseService
            .from('staff_shifts')
            .select('*, staff:users(username)')
            .gte('shift_date', weekStart)
            .lte('shift_date', new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        if (weekError) throw weekError;
        return NextResponse.json(weekShifts);
    }

    if (error) throw error;
    return NextResponse.json(shifts);
  } catch (error) {
    console.error("[ADMIN_SCHEDULE_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_users");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const { shifts, week_start, week_end } = body;

    // 1. Ensure schedule exists
    let { data: schedule, error: schedError } = await supabaseService
      .from('staff_schedules')
      .select('id')
      .eq('week_start', week_start)
      .maybeSingle();

    if (!schedule) {
      const { data: newSched, error: createError } = await supabaseService
        .from('staff_schedules')
        .insert({ week_start, week_end, created_by: user.id })
        .select()
        .single();
      if (createError) throw createError;
      schedule = newSched;
    }

    if (!schedule) throw new Error("Failed to resolve or create schedule");

    // 2. Insert/Update shifts
    const shiftsToInsert = shifts.map((s: any) => ({
      schedule_id: schedule.id,
      staff_id: s.staff_id,
      shift_date: s.shift_date,
      start_time: s.start_time,
      end_time: s.end_time,
      status: 'scheduled'
    }));

    // Delete existing shifts for this schedule if we are overwriting
    await supabaseService.from('staff_shifts').delete().eq('schedule_id', schedule.id);

    const { data, error } = await supabaseService
      .from('staff_shifts')
      .insert(shiftsToInsert)
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_SCHEDULE_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_users");
