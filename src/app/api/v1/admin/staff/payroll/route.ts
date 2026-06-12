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

    if (shiftError) {
      console.error('[PAYROLL] shift fetch error:', shiftError);
      throw shiftError;
    }

    if (!shifts || shifts.length === 0) {
      // No shifts at all for this period — return empty array (expected)
      return NextResponse.json([]);
    }

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
          total_calculated_payroll: 0,
          games: []  // track all game logs for total_revenue calculation
        };
      }

      const hours = Number(shift.hours_actual || shift.hours_planned || 0);
      payrollData[staffId].total_hours += hours;
      payrollData[staffId].hours_pay += hours * Number(shift.staff.hourly_rate);
      
      const games = shift.shift_game_log || [];
      payrollData[staffId].games_count += games.length;
      payrollData[staffId].games.push(...games);
      payrollData[staffId].commission_pay += games.reduce((acc: number, g: any) => acc + Number(g.commission_amount), 0);
    });

    const staffIds = Object.keys(payrollData);
    const result: any[] = [];

    if (staffIds.length > 0) {
      // 3. Upsert payroll_records — only write non-generated columns
      // hours_pay, commission_pay, total_pay are GENERATED columns in Postgres — cannot be written
      for (const staffId of staffIds) {
        const p = payrollData[staffId];
        p.total_calculated_payroll = p.hours_pay + p.commission_pay;

        const { error: upsertError } = await supabaseService
          .from('payroll_records')
          .upsert({
            staff_id: staffId,
            week_start: weekStart,
            week_end: weekEnd,
            total_hours: p.total_hours,
            hourly_rate: p.staff.hourly_rate,
            // total_revenue drives the generated commission_pay column
            total_revenue: p.games.reduce((acc: number, g: any) => acc + Number(g.game_revenue || 0), 0),
            games_count: p.games_count,
            commission_rate: p.staff.commission_rate ?? 0,
            // total_calculated_payroll is our NEW non-generated column
            total_calculated_payroll: p.total_calculated_payroll
          }, { onConflict: 'staff_id, week_start' });

        if (upsertError) {
          console.error('[PAYROLL] upsert error for staff', staffId, ':', JSON.stringify(upsertError));
          throw upsertError;
        }
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
      // Use our own computed hours_pay/commission_pay (not the DB generated columns which may be stale)
      records?.forEach(record => {
        const agg = payrollData[record.staff_id];
        const staffDetails = agg.staff;
        const totalCalculated = agg.total_calculated_payroll;  // always live-computed
        const totalPaid = Number(record.total_paid_so_far || 0);
        const remainingBalance = totalCalculated - totalPaid;

        result.push({
          id: record.id,
          staff: staffDetails,
          total_hours: agg.total_hours,
          hours_pay: agg.hours_pay,
          games_count: agg.games_count,
          commission_pay: agg.commission_pay,
          total_calculated_payroll: totalCalculated,
          total_paid_so_far: totalPaid,
          is_settled: record.is_settled || false,
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
    const { payroll_record_id, amount_paid, payment_method, notes, force_settle } = body;

    if (!payroll_record_id || amount_paid === undefined || amount_paid < 0 || (amount_paid === 0 && !force_settle)) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    }

    // 1. Fetch payroll record INCLUDING staff_id and week info so we can live-recalculate
    const { data: record, error: fetchError } = await supabaseService
      .from('payroll_records')
      .select('id, staff_id, week_start, week_end, total_paid_so_far, total_calculated_payroll, hourly_rate')
      .eq('id', payroll_record_id)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    // 2. Live-recalculate total to prevent stale-data validation rejections
    const { data: shifts } = await supabaseService
      .from('staff_shifts')
      .select('*, shift_game_log(*)')
      .eq('staff_id', record.staff_id)
      .gte('shift_date', record.week_start)
      .lte('shift_date', record.week_end);

    let liveHoursPay = 0;
    let liveCommissionPay = 0;
    shifts?.forEach(shift => {
      const hours = Number(shift.hours_actual || shift.hours_planned || 0);
      liveHoursPay += hours * Number(record.hourly_rate || 0);
      const games = shift.shift_game_log || [];
      liveCommissionPay += games.reduce((acc: number, g: any) => acc + Number(g.commission_amount), 0);
    });
    const liveTotalCalculated = liveHoursPay + liveCommissionPay;

    // Update the DB with the freshest calculation before validating
    await supabaseService
      .from('payroll_records')
      .update({ total_calculated_payroll: liveTotalCalculated })
      .eq('id', payroll_record_id);

    const totalPaidSoFar = Number(record.total_paid_so_far || 0);
    const liveRemainingBalance = liveTotalCalculated - totalPaidSoFar;

    // 3. Validate against live remaining balance — skip if force_settle is set
    if (!force_settle && amount_paid > liveRemainingBalance + 0.01) { // +0.01 for float tolerance
      return NextResponse.json({ 
        error: `Cannot pay more than remaining balance (${liveRemainingBalance.toFixed(2)} EGP). Total is now ${liveTotalCalculated.toFixed(2)} EGP.` 
      }, { status: 400 });
    }

    // 4. Insert payment ledger entry
    const { data: payment, error: paymentError } = await supabaseService
      .from('payroll_payments')
      .insert({
        payroll_record_id,
        amount_paid,
        paid_by: user.id,
        payment_method: payment_method || 'cash',
        notes: notes || ''
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 5. Update total_paid_so_far atomically; if force_settle, also set is_settled = true
    const newTotalPaid = totalPaidSoFar + Number(amount_paid);
    const updatePayload: Record<string, any> = { total_paid_so_far: newTotalPaid };
    if (force_settle) {
      updatePayload.is_settled = true;
      console.log(`[PAYROLL] Force-settle applied for record ${payroll_record_id}. Paid: ${amount_paid}, Due: ${liveRemainingBalance.toFixed(2)}`);
    }
    const { error: updateError } = await supabaseService
      .from('payroll_records')
      .update(updatePayload)
      .eq('id', payroll_record_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, payment, new_total_paid: newTotalPaid, live_total_calculated: liveTotalCalculated });
  } catch (error) {
    console.error("[ADMIN_PAYROLL_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");
