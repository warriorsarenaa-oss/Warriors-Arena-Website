import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { roundEGP } from "@/lib/utils/format";

// ─── Shared aggregation helper ───────────────────────────────────────────────

function aggregateShifts(shifts: any[]): Record<string, any> {
  const payrollData: Record<string, any> = {};

  shifts.forEach(shift => {
    const staffId = shift.staff_id;
    if (!payrollData[staffId]) {
      payrollData[staffId] = {
        staff: shift.staff,
        total_hours: 0,
        games_count: 0,
        commission_pay: 0,
        hours_pay: 0,
        total_calculated_payroll: 0,
        games: [],
      };
    }

    const hours = Number(shift.hours_actual || shift.hours_planned || 0);
    payrollData[staffId].total_hours   = roundEGP(payrollData[staffId].total_hours + hours);
    payrollData[staffId].hours_pay     = roundEGP(
      payrollData[staffId].hours_pay + roundEGP(hours * Number(shift.staff.hourly_rate))
    );

    const games = shift.shift_game_log || [];
    payrollData[staffId].games_count += games.length;
    payrollData[staffId].games.push(...games);
    payrollData[staffId].commission_pay = roundEGP(
      payrollData[staffId].commission_pay +
      games.reduce((acc: number, g: any) => roundEGP(acc + roundEGP(Number(g.commission_amount || 0))), 0)
    );
  });

  Object.values(payrollData).forEach((p: any) => {
    p.total_calculated_payroll = roundEGP(p.hours_pay + p.commission_pay);
  });

  return payrollData;
}

// ─── GET — Pure read. Zero writes. ───────────────────────────────────────────
// Call POST /recalculate first to sync commission records and upsert payroll_records.

export const GET = requirePermission(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get('week_start');
  const weekEnd   = searchParams.get('week_end');

  if (!weekStart || !weekEnd) {
    return NextResponse.json({ error: "week_start and week_end required" }, { status: 400 });
  }

  try {
    // 1. Read shifts with their existing commission logs — no side-effect writes
    const { data: shifts, error: shiftError } = await supabaseService
      .from('staff_shifts')
      .select('*, staff:users(*), shift_game_log(*)')
      .gte('shift_date', weekStart)
      .lte('shift_date', weekEnd);

    if (shiftError) {
      console.error('[PAYROLL GET] shift fetch error:', shiftError);
      throw shiftError;
    }

    if (!shifts || shifts.length === 0) return NextResponse.json([]);

    // 2. Aggregate in memory
    const payrollData = aggregateShifts(shifts);
    const staffIds    = Object.keys(payrollData);

    // 3. Fetch existing payroll_records (pure SELECT)
    const { data: records, error: recordsError } = await supabaseService
      .from('payroll_records')
      .select('*, payroll_payments (*)')
      .in('staff_id', staffIds)
      .gte('week_start', weekStart)
      .lte('week_end', weekEnd);

    if (recordsError) throw recordsError;

    // 4. Build response
    const result = staffIds.map(staffId => {
      const agg    = payrollData[staffId];
      const record = records?.find(r => r.staff_id === staffId);
      const totalPaid = roundEGP(Number(record?.total_paid_so_far || 0));

      return {
        id: record?.id ?? null,
        staff: agg.staff,
        total_hours: agg.total_hours,
        hours_pay: agg.hours_pay,
        games_count: agg.games_count,
        commission_pay: agg.commission_pay,
        total_calculated_payroll: agg.total_calculated_payroll,
        total_paid_so_far: totalPaid,
        is_settled: record?.is_settled || false,
        previously_pushed_to_expenses: Number(record?.previously_pushed_to_expenses || 0),
        remaining_balance: roundEGP(agg.total_calculated_payroll - totalPaid),
        payment_history: record?.payroll_payments || [],
        games: agg.games,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ADMIN_PAYROLL_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");

// ─── POST — Record a payment against an existing payroll record ───────────────

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const { payroll_record_id, amount_paid, payment_method, notes, force_settle, remaining_action } = body;

    const shouldForceSettle = force_settle || remaining_action === "forgive";
    const allowOverpayment  = remaining_action === "credit";

    if (!payroll_record_id || amount_paid === undefined || amount_paid < 0 || (amount_paid === 0 && !shouldForceSettle)) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    }

    // 1. Fetch record for live recalculation
    const { data: record, error: fetchError } = await supabaseService
      .from('payroll_records')
      .select('id, staff_id, week_start, week_end, total_paid_so_far, total_calculated_payroll, hourly_rate')
      .eq('id', payroll_record_id)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    // 2. Live-recalculate total from shift data to prevent stale-data validation rejections
    const { data: shifts } = await supabaseService
      .from('staff_shifts')
      .select('*, shift_game_log(*)')
      .eq('staff_id', record.staff_id)
      .gte('shift_date', record.week_start)
      .lte('shift_date', record.week_end);

    let liveHoursPay    = 0;
    let liveCommPay     = 0;
    shifts?.forEach(shift => {
      const hours = Number(shift.hours_actual || shift.hours_planned || 0);
      liveHoursPay    = roundEGP(liveHoursPay + roundEGP(hours * Number(record.hourly_rate || 0)));
      const games = shift.shift_game_log || [];
      liveCommPay     = roundEGP(
        liveCommPay +
        games.reduce((acc: number, g: any) => roundEGP(acc + roundEGP(Number(g.commission_amount || 0))), 0)
      );
    });
    const liveTotalCalculated   = roundEGP(liveHoursPay + liveCommPay);
    const totalPaidSoFar        = roundEGP(Number(record.total_paid_so_far || 0));
    const liveRemainingBalance  = roundEGP(liveTotalCalculated - totalPaidSoFar);

    // Persist the freshest calculation
    await supabaseService
      .from('payroll_records')
      .update({ total_calculated_payroll: liveTotalCalculated })
      .eq('id', payroll_record_id);

    // 3. Validate remaining balance (skip for force_settle or credit/overpayment)
    if (!shouldForceSettle && !allowOverpayment && amount_paid > liveRemainingBalance + 0.01) {
      return NextResponse.json({
        error: `Cannot pay more than remaining balance (${liveRemainingBalance.toFixed(2)} EGP). Total is now ${liveTotalCalculated.toFixed(2)} EGP.`
      }, { status: 400 });
    }

    // 4. Insert payment ledger entry (only if amount > 0)
    let payment = null;
    if (amount_paid > 0) {
      const { data: p, error: paymentError } = await supabaseService
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
      payment = p;
    }

    // 5. Update total_paid_so_far; mark is_settled when force-settling
    const newTotalPaid = roundEGP(totalPaidSoFar + Number(amount_paid));
    const updatePayload: Record<string, any> = { total_paid_so_far: newTotalPaid };
    if (shouldForceSettle) {
      updatePayload.is_settled = true;
      console.log(`[PAYROLL] Force-settle for record ${payroll_record_id}. Paid: ${amount_paid}, Due was: ${liveRemainingBalance.toFixed(2)}`);
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
