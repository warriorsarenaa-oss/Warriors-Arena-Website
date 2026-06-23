import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { roundEGP } from "@/lib/utils/format";
import type { SalaryCardData, SalaryPayment } from "@/features/salaries/types";

// Intermediate type representing a payroll_records row with embedded joins.
// Supabase returns joined tables as plain objects; we cast once below.
type EmbeddedExpense = {
  id: string;
  amount: number;
  expense_date: string;
  notes: string | null;
};

type EmbeddedUser = {
  username: string;
  full_name: string;
};

type PayrollRecordRow = {
  id: string;
  staff_id: string;
  week_start: string;
  hours_pay: number | null;
  total_hours: number | null;
  games_count: number | null;
  commission_pay: number | null;
  total_calculated_payroll: number | null;
  users: EmbeddedUser | null;
  expenses: EmbeddedExpense[] | null;
};

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "Date range required" }, { status: 400 });
    }

    // Query payroll_records in date range, embedding related users and expenses.
    // Filtering on week_start ensures we capture the full pay week rather than
    // the push date, which can land a day or two later.
    const { data: rawRecords, error } = await supabaseService
      .from("payroll_records")
      .select(`
        id,
        staff_id,
        week_start,
        hours_pay,
        total_hours,
        games_count,
        commission_pay,
        total_calculated_payroll,
        users!staff_id (
          username,
          full_name
        ),
        expenses (
          id,
          amount,
          expense_date,
          notes
        )
      `)
      .gte("week_start", from)
      .lte("week_start", to)
      .order("week_start", { ascending: false });

    if (error) throw error;

    // Aggregate per staff_id in-memory. Data volume is tiny (< 100 rows / month).
    const grouped = new Map<string, SalaryCardData>();

    for (const raw of rawRecords ?? []) {
      // Cast once; the embedded shape matches PayrollRecordRow exactly.
      const record = raw as unknown as PayrollRecordRow;
      const { staff_id } = record;
      const staff = record.users;

      if (!grouped.has(staff_id)) {
        grouped.set(staff_id, {
          staffId: staff_id,
          username: staff?.username ?? "staff",
          displayName: staff?.full_name ?? "Staff Member",
          totalPaid: 0,
          totalCalculated: 0,
          totalHoursPay: 0,
          totalHours: 0,
          totalCommission: 0,
          totalMissions: 0,
          lastPaymentDate: null,
          status: "unpaid",
          paymentHistory: [],
        });
      }

      const g = grouped.get(staff_id)!;
      g.totalHoursPay = roundEGP(g.totalHoursPay + Number(record.hours_pay ?? 0));
      g.totalHours += Number(record.total_hours ?? 0);
      g.totalCommission = roundEGP(g.totalCommission + Number(record.commission_pay ?? 0));
      g.totalMissions += Number(record.games_count ?? 0);
      g.totalCalculated = roundEGP(g.totalCalculated + Number(record.total_calculated_payroll ?? 0));

      for (const exp of record.expenses ?? []) {
        const amount = roundEGP(Number(exp.amount ?? 0));
        g.totalPaid = roundEGP(g.totalPaid + amount);

        if (!g.lastPaymentDate || exp.expense_date > g.lastPaymentDate) {
          g.lastPaymentDate = exp.expense_date;
        }

        const payment: SalaryPayment = {
          id: exp.id,
          date: exp.expense_date,
          amount,
          notes: exp.notes ?? null,
        };
        g.paymentHistory.push(payment);
      }
    }

    // Compute status and sort history newest-first.
    const result: SalaryCardData[] = Array.from(grouped.values()).map((g) => {
      const remaining = roundEGP(g.totalCalculated - g.totalPaid);

      let status: SalaryCardData["status"];
      if (g.totalPaid <= 0) {
        status = "unpaid";
      } else if (remaining <= 0.01) {
        status = "settled";
      } else {
        status = "partial";
      }

      return {
        ...g,
        status,
        paymentHistory: [...g.paymentHistory].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
      };
    });

    // Sort alphabetically by display name for consistent ordering.
    result.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ADMIN_SALARIES_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_financials");
