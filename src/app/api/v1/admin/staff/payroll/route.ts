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

    // 1.5 Retroactive commission sync
    // Fetch all completed bookings for the week to ensure any retroactively created shifts get their commission
    const { data: bookings } = await supabaseService
      .from('bookings')
      .select('id, booking_code, booking_date, start_time, game_name, final_amount_paid')
      .gte('booking_date', weekStart)
      .lte('booking_date', weekEnd)
      .eq('status', 'completed');

    if (bookings && shifts) {
      for (const booking of bookings) {
        const bTime = booking.start_time?.slice(0, 5);
        if (!bTime) continue;

        // Find all shifts that cover this booking
        const overlappingShifts = shifts.filter(s => {
          if (s.shift_date !== booking.booking_date) return false;
          const sStart = s.start_time?.slice(0, 5);
          const sEnd = s.end_time?.slice(0, 5);
          return sStart && sEnd && sStart <= bTime && sEnd > bTime;
        });

        if (overlappingShifts.length > 0) {
          const splitRevenue = (booking.final_amount_paid || 0) / overlappingShifts.length;

          for (const shift of overlappingShifts) {
            const commissionAmount = (splitRevenue * (shift.staff.commission_rate || 0)) / 100;
            if (!shift.shift_game_log) shift.shift_game_log = [];
            const existingLog = shift.shift_game_log.find((log: any) => log.booking_id === booking.id);
            
            if (!existingLog) {
              const { data: newLog } = await supabaseService.from('shift_game_log').insert({
                shift_id: shift.id,
                booking_id: booking.id,
                booking_code: booking.booking_code,
                game_name: booking.game_name || 'Game',
                game_completed_at: new Date().toISOString(),
                game_revenue: splitRevenue,
                commission_amount: commissionAmount
              }).select().single();
              
              if (newLog) shift.shift_game_log.push(newLog);
            } else if (existingLog.game_revenue !== splitRevenue) {
               await supabaseService.from('shift_game_log').update({
                  game_revenue: splitRevenue,
                  commission_amount: commissionAmount
               }).eq('id', existingLog.id);
               existingLog.game_revenue = splitRevenue;
               existingLog.commission_amount = commissionAmount;
            }
          }
        }
      }
    }

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
          total_calculated_payroll: 0
        };
      }

      const hours = Number(shift.hours_actual || shift.hours_planned || 0);
      payrollData[staffId].total_hours += hours;
      payrollData[staffId].hours_pay += hours * Number(shift.staff.hourly_rate);
      
      const games = shift.shift_game_log || [];
      payrollData[staffId].games_count += games.length;
      payrollData[staffId].commission_pay += games.reduce((acc: number, g: any) => acc + Number(g.commission_amount), 0);
    });

    const staffIds = Object.keys(payrollData);
    const result: any[] = [];

    if (staffIds.length > 0) {
      // 3. Upsert payroll_records with new calculations
      for (const staffId of staffIds) {
        const p = payrollData[staffId];
        p.total_calculated_payroll = p.hours_pay + p.commission_pay;

        // Upsert to maintain a single record per staff per week
        const { error: upsertError } = await supabaseService
          .from('payroll_records')
          .upsert({
            staff_id: staffId,
            week_start: weekStart,
            week_end: weekEnd,
            total_hours: p.total_hours,
            hourly_rate: p.staff.hourly_rate,
            hours_pay: p.hours_pay,
            games_count: p.games_count,
            commission_per_game: p.staff.commission_per_game,
            commission_pay: p.commission_pay,
            total_calculated_payroll: p.total_calculated_payroll
          }, { onConflict: 'staff_id, week_start' });
        
        if (upsertError) throw upsertError;
      }

      // 4. Fetch the updated records with payment history
      const { data: records, error: recordsError } = await supabaseService
        .from('payroll_records')
        .select(`
          *,
          payroll_payments (*)
        `)
        .in('staff_id', staffIds)
        .gte('week_start', weekStart)
        .lte('week_end', weekEnd);

      if (recordsError) throw recordsError;

      // Map back staff details and calculate remaining balance
      records?.forEach(record => {
        const staffDetails = payrollData[record.staff_id].staff;
        const totalCalculated = Number(record.total_calculated_payroll || 0);
        const totalPaid = Number(record.total_paid_so_far || 0);
        const remainingBalance = totalCalculated - totalPaid;

        result.push({
          id: record.id,
          staff: staffDetails,
          total_hours: record.total_hours,
          hours_pay: record.hours_pay,
          games_count: record.games_count,
          commission_pay: record.commission_pay,
          total_calculated_payroll: totalCalculated,
          total_paid_so_far: totalPaid,
          previously_pushed_to_expenses: Number(record.previously_pushed_to_expenses || 0),
          remaining_balance: remainingBalance,
          payment_history: record.payroll_payments || []
        });
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ADMIN_PAYROLL_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const { payroll_record_id, amount_paid, payment_method, notes } = body;

    if (!payroll_record_id || !amount_paid || amount_paid <= 0) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    }

    // 1. Fetch current payroll record
    const { data: record, error: fetchError } = await supabaseService
      .from('payroll_records')
      .select('total_calculated_payroll, total_paid_so_far')
      .eq('id', payroll_record_id)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    const remainingBalance = Number(record.total_calculated_payroll) - Number(record.total_paid_so_far);

    // Validate payment amount against remaining balance
    if (amount_paid > remainingBalance) {
       return NextResponse.json({ error: `Cannot pay more than remaining balance (${remainingBalance} EGP)` }, { status: 400 });
    }

    // 2. Insert payment history
    const { data: payment, error: paymentError } = await supabaseService
      .from('payroll_payments')
      .insert({
        payroll_record_id,
        amount_paid,
        paid_by: user.id,
        payment_method: payment_method || 'cash',
        notes
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 3. Update total_paid_so_far
    const newTotalPaid = Number(record.total_paid_so_far) + Number(amount_paid);
    const { error: updateError } = await supabaseService
      .from('payroll_records')
      .update({ total_paid_so_far: newTotalPaid })
      .eq('id', payroll_record_id);

    if (updateError) throw updateError;

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("[ADMIN_PAYROLL_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");
