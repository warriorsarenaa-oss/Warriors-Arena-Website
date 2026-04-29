import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "Date range required" }, { status: 400 });
    }

    // 1. Fetch all users who have salaries or commissions
    const { data: users, error: usersError } = await supabaseService
      .from("users")
      .select("id, username, fixed_monthly_salary, commission_percentage")
      .eq("is_active", true);

    if (usersError) throw usersError;

    // 2. Fetch commissions from commission_logs for the period
    const { data: logs, error: logsError } = await supabaseService
      .from("commission_logs")
      .select(`
        id, 
        user_id, 
        amount, 
        percentage, 
        created_at,
        bookings!booking_id (
          booking_code,
          customer_name,
          booking_date
        )
      `)
      .gte("created_at", `${from}T00:00:00Z`)
      .lte("created_at", `${to}T23:59:59Z`);

    if (logsError) throw logsError;

    // 3. Aggregate data per user
    const salaryReports = users.map(user => {
      const userLogs = logs?.filter(l => l.user_id === user.id) || [];
      const totalCommission = userLogs.reduce((sum, log) => sum + Number(log.amount), 0);
      
      return {
        id: user.id,
        username: user.username,
        base_salary: Number(user.fixed_monthly_salary),
        total_commission: totalCommission,
        total_payout: Number(user.fixed_monthly_salary) + totalCommission,
        commission_count: userLogs.length,
        logs: userLogs.map(l => ({
          id: l.id,
          amount: l.amount,
          date: l.created_at,
          booking_code: (l.bookings as any)?.booking_code,
          customer: (l.bookings as any)?.customer_name
        }))
      };
    });

    return NextResponse.json(salaryReports);

  } catch (error: any) {
    console.error("[ADMIN_SALARIES_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_financials");
