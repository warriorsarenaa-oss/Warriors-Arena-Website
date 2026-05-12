import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get('week_start');
  const weekEnd = searchParams.get('week_end');
  const scheduleId = searchParams.get('schedule_id');

  if (!weekStart || !weekEnd || !scheduleId) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  // 1. Get all shifts for this week/schedule
  const { data: shifts, error: shiftsError } = await supabaseService
    .from('staff_shifts')
    .select(`
      *,
      users!staff_id (
        id,
        full_name,
        hourly_rate,
        commission_rate
      )
    `)
    .eq('schedule_id', scheduleId);

  if (shiftsError) return NextResponse.json({ error: shiftsError.message }, { status: 500 });

  // 2. Aggregate data per staff
  const payrollData: Record<string, any> = {};

  for (const shift of shifts) {
    const staffId = shift.staff_id;
    const staff = (shift as any).users;

    if (!payrollData[staffId]) {
      payrollData[staffId] = {
        staff_id: staffId,
        staff_name: staff.full_name,
        hourly_rate: staff.hourly_rate,
        commission_rate: staff.commission_rate || 0,
        total_hours: 0,
        games_count: 0,
        total_revenue: 0,
        shifts: []
      };
    }

    payrollData[staffId].total_hours += Number(shift.hours_planned || 0);
    payrollData[staffId].shifts.push(shift.id);
  }

  // 3. Count games and calculate revenue for each shift
  for (const staffId in payrollData) {
    const shiftIds = payrollData[staffId].shifts;
    const { data: logs, error: logsError } = await supabaseService
      .from('shift_game_log')
      .select('game_revenue')
      .in('shift_id', shiftIds);

    if (!logsError && logs) {
      payrollData[staffId].games_count = logs.length;
      payrollData[staffId].total_revenue = logs.reduce((acc: number, curr: any) => acc + Number(curr.game_revenue || 0), 0);
    }
  }

  // 4. Get payment status
  const { data: paidRecords } = await supabaseService
    .from('payroll_records')
    .select('staff_id, is_paid')
    .eq('week_start', weekStart);

  const paidMap = new Set((paidRecords || []).filter(r => r.is_paid).map(r => r.staff_id));

  // 5. Calculate final values
  const results = Object.values(payrollData).map((p: any) => {
    const hours_pay = p.total_hours * p.hourly_rate;
    const commission_pay = (p.total_revenue * p.commission_rate) / 100;
    return {
      ...p,
      hours_pay,
      commission_pay,
      total_pay: hours_pay + commission_pay,
      is_paid: paidMap.has(p.staff_id)
    };
  });

  return NextResponse.json(results);
}, "manage_financials");
