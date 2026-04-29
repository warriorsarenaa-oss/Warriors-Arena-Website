import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { startOfMonth, startOfQuarter, startOfYear, parseISO } from "date-fns";

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const period = searchParams.get('period');

    let startDate: Date;
    let endDate = new Date();

    if (fromStr && toStr) {
       startDate = parseISO(fromStr);
       endDate = parseISO(toStr);
    } else if (period === 'year') {
       startDate = startOfYear(new Date());
    } else if (period === 'quarter') {
       startDate = startOfQuarter(new Date());
    } else {
       startDate = startOfMonth(new Date());
    }

    const startISO = startDate.toISOString().substring(0, 10);
    const endISO = endDate.toISOString().substring(0, 10);

    // 1. Realized Revenue Logic
    const { data: bookings, error: bookingError } = await supabaseService
      .from('bookings')
      .select('id, status, total_price_at_booking, booking_date, deposit_amount, deposit_status, final_amount_paid')
      .gte('booking_date', startISO)
      .lte('booking_date', endISO);

    if (bookingError) throw bookingError;

    let realized_revenue = 0;
    const dailyMap: Record<string, number> = {};
    
    if (bookings) {
      bookings.forEach(b => {
        let moneyCollected = 0;
        const price = Number(b.total_price_at_booking);
        const deposit = Number((b as any).deposit_amount || price * 0.25);
        
        if (b.status === 'completed') {
          moneyCollected = b.final_amount_paid ? Number(b.final_amount_paid) : price;
        } else if (b.status === 'no_show') {
          moneyCollected = deposit;
        } else if (b.status === 'cancelled' && (b as any).deposit_status === 'forfeited') {
          moneyCollected = deposit;
        }

        if (moneyCollected > 0) {
          realized_revenue += moneyCollected;
          dailyMap[b.booking_date] = (dailyMap[b.booking_date] || 0) + moneyCollected;
        }
      });
    }

    const daily_revenue_data = Object.keys(dailyMap).sort().map(date => ({
       date, amount: dailyMap[date]
    }));

    // 2. Expenses
    const { data: expenses } = await supabaseService
      .from('expenses')
      .select('amount')
      .gte('expense_date', startISO)
      .lte('expense_date', endISO);

    const total_expenses = (expenses || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
    const profit = realized_revenue - total_expenses;

    return NextResponse.json({
      realized_revenue,
      total_expenses,
      profit,
      daily_revenue_data
    });
  } catch (error: any) {
    console.error("[ADMIN_FINANCIALS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_financials");
