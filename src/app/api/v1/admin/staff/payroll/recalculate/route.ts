import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { roundEGP } from "@/lib/utils/format";

// ─── POST /api/v1/admin/staff/payroll/recalculate ────────────────────────────
// Syncs retroactive commission records and upserts payroll_records for the week.
// Idempotent — safe to call on every page load.
// Separated from GET so reads are never blocked by writes (Fix 4).

export const POST = requirePermission(async (request: Request) => {
  try {
    const body = await request.json();
    const { week_start, week_end } = body;

    if (!week_start || !week_end) {
      return NextResponse.json({ error: "week_start and week_end required" }, { status: 400 });
    }

    // ── Step 1: Load shifts for the week ──────────────────────────────────────
    const { data: shifts, error: shiftError } = await supabaseService
      .from('staff_shifts')
      .select('*, staff:users(*), shift_game_log(*)')
      .gte('shift_date', week_start)
      .lte('shift_date', week_end);

    if (shiftError) {
      console.error('[PAYROLL RECALCULATE] shift fetch error:', shiftError);
      throw shiftError;
    }

    if (!shifts || shifts.length === 0) {
      return NextResponse.json([]);
    }

    // ── Step 2: Commission sync — insert/update shift_game_log ────────────────
    // Finds completed bookings whose start_time falls inside a shift window.
    // Skips manual entries. Retroactive inserts get commission_source='retroactive'.
    const { data: completedBookings } = await supabaseService
      .from('bookings')
      .select('id, booking_code, game_name, start_time, booking_date, final_amount_paid')
      .gte('booking_date', week_start)
      .lte('booking_date', week_end)
      .eq('status', 'completed');

    for (const booking of completedBookings || []) {
      const normalizedBookingTime = booking.start_time?.slice(0, 5);

      const shiftsOnDate = shifts.filter(s => s.shift_date === booking.booking_date);
      const overlapping  = shiftsOnDate.filter(s => {
        const sStart = s.start_time?.slice(0, 5);
        const sEnd   = s.end_time?.slice(0, 5);
        return sStart && sEnd && sStart <= normalizedBookingTime && sEnd > normalizedBookingTime;
      });

      const fullRevenue = Number(booking.final_amount_paid || 0);

      for (const shift of overlapping) {
        const { data: existingLog } = await supabaseService
          .from('shift_game_log')
          .select('id, commission_source, game_revenue')
          .eq('booking_id', booking.id)
          .eq('shift_id', shift.id)
          .maybeSingle();

        const rate             = Number(shift.staff?.commission_rate || 0);
        const commissionAmount = roundEGP((fullRevenue * rate) / 100);

        if (!existingLog) {
          await supabaseService.from('shift_game_log').insert({
            shift_id: shift.id,
            booking_id: booking.id,
            booking_code: booking.booking_code,
            game_name: booking.game_name || 'Game',
            game_completed_at: new Date().toISOString(),
            game_revenue: fullRevenue,
            commission_amount: commissionAmount,
            commission_source: 'retroactive',
          });
        } else if (
          existingLog.commission_source !== 'manual' &&
          existingLog.game_revenue !== fullRevenue
        ) {
          // Revenue changed after completion (e.g. discount applied) — update non-manual records
          await supabaseService
            .from('shift_game_log')
            .update({ game_revenue: fullRevenue, commission_amount: commissionAmount })
            .eq('id', existingLog.id);
        }
      }
    }

    // ── Step 3: Re-read shifts with fresh commission logs ─────────────────────
    const { data: freshShifts } = await supabaseService
      .from('staff_shifts')
      .select('*, staff:users(*), shift_game_log(*)')
      .gte('shift_date', week_start)
      .lte('shift_date', week_end);

    // ── Step 4: Aggregate in memory ───────────────────────────────────────────
    const payrollData: Record<string, any> = {};

    (freshShifts || []).forEach(shift => {
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
      payrollData[staffId].total_hours = roundEGP(payrollData[staffId].total_hours + hours);
      payrollData[staffId].hours_pay   = roundEGP(
        payrollData[staffId].hours_pay + roundEGP(hours * Number(shift.staff.hourly_rate))
      );

      const games = shift.shift_game_log || [];
      payrollData[staffId].games_count += games.length;
      payrollData[staffId].games.push(...games);
      payrollData[staffId].commission_pay = roundEGP(
        payrollData[staffId].commission_pay +
        games.reduce(
          (acc: number, g: any) => roundEGP(acc + roundEGP(Number(g.commission_amount || 0))),
          0
        )
      );
    });

    const staffIds = Object.keys(payrollData);
    staffIds.forEach(staffId => {
      const p = payrollData[staffId];
      p.total_calculated_payroll = roundEGP(p.hours_pay + p.commission_pay);
    });

    // ── Step 5: Upsert payroll_records (Fix 2: commission_pay now included) ───
    for (const staffId of staffIds) {
      const p = payrollData[staffId];
      const { error: upsertError } = await supabaseService
        .from('payroll_records')
        .upsert({
          staff_id: staffId,
          week_start,
          week_end,
          total_hours: p.total_hours,
          total_revenue: roundEGP(
            (p.games as any[]).reduce((acc: number, g: any) => roundEGP(acc + roundEGP(Number(g.game_revenue || 0))), 0)
          ),
          games_count: p.games_count,
          hourly_rate: Number(p.staff.hourly_rate || 0),
          commission_rate: Number(p.staff.commission_rate || 0),
          hours_pay: p.hours_pay,
          commission_pay: p.commission_pay,
          total_calculated_payroll: p.total_calculated_payroll,
        }, {
          onConflict: 'staff_id,week_start',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error(`[PAYROLL RECALCULATE] upsert error for staff ${staffId}:`, upsertError);
      }
    }

    // ── Step 6: Fetch persisted records for IDs + payment history ────────────
    const { data: records, error: recordsError } = await supabaseService
      .from('payroll_records')
      .select('*, payroll_payments (*)')
      .in('staff_id', staffIds)
      .gte('week_start', week_start)
      .lte('week_end', week_end);

    if (recordsError) throw recordsError;

    // ── Step 7: Build response (same shape as GET) ────────────────────────────
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
    console.error("[PAYROLL_RECALCULATE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");
