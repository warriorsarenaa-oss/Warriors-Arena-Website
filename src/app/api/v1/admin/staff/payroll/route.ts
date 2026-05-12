import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

export const GET = requirePermission(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get('week_start');
  const weekEnd = searchParams.get('week_end');

  if (!weekStart || !weekEnd) {
    return NextResponse.json({ error: "week_start and week_end required" }, { status: 400 });
  }

  try {
    // 1. Get all shifts for the week
    const { data: shifts, error: shiftError } = await supabaseService
      .from('staff_shifts')
      .select('*, staff:users(*), shift_game_log(*)')
      .gte('shift_date', weekStart)
      .lte('shift_date', weekEnd);

    if (shiftError) throw shiftError;

    // 2. Aggregate by staff
    const payrollData: Record<string, any> = {};

    shifts?.forEach(shift => {
      const staffId = shift.staff_id;
      if (!payrollData[staffId]) {
        payrollData[staffId] = {
          staff: shift.staff,
          total_hours: 0,
          games_count: 0,
          commission_pay: 0,
          hours_pay: 0,
          total_pay: 0
        };
      }

      const hours = Number(shift.hours_actual || shift.hours_planned || 0);
      payrollData[staffId].total_hours += hours;
      payrollData[staffId].hours_pay += hours * Number(shift.staff.hourly_rate);
      
      const games = shift.shift_game_log || [];
      payrollData[staffId].games_count += games.length;
      payrollData[staffId].commission_pay += games.reduce((acc: number, g: any) => acc + Number(g.commission_amount), 0);
    });

    const result = Object.values(payrollData).map(p => ({
      ...p,
      total_pay: p.hours_pay + p.commission_pay
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ADMIN_PAYROLL_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const { staff_id, week_start, week_end, total_hours, hourly_rate, hours_pay, games_count, commission_per_game, commission_pay, total_pay, payment_method, notes } = body;

    // 1. Create payroll record
    const { data: payroll, error: payrollError } = await supabaseService
      .from('payroll_records')
      .insert({
        staff_id, week_start, week_end, total_hours, hourly_rate, hours_pay, 
        games_count, commission_per_game, commission_pay, total_pay,
        is_paid: true, paid_at: new Date().toISOString(), paid_by: user.id,
        payment_method, notes
      })
      .select()
      .single();

    if (payrollError) throw payrollError;

    // 2. Get Payroll Category ID
    const { data: category } = await supabaseService
      .from('expense_categories')
      .select('id')
      .eq('name', 'Payroll')
      .single();

    // 3. Create expense record
    const { error: expenseError } = await supabaseService
      .from('expenses')
      .insert({
        title: `Payroll: ${week_start} to ${week_end}`,
        category_id: category?.id,
        amount: total_pay,
        expense_date: new Date().toISOString().split('T')[0],
        payroll_record_id: payroll.id,
        created_by_user_id: user.id,
        currency: 'EGP'
      });

    if (expenseError) throw expenseError;

    return NextResponse.json(payroll);
  } catch (error) {
    console.error("[ADMIN_PAYROLL_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");
