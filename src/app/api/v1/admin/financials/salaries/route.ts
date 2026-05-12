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

    // 1. Fetch Payroll category
    const { data: category } = await supabaseService
      .from('expense_categories')
      .select('id')
      .eq('name', 'Payroll')
      .single();

    if (!category) {
      return NextResponse.json([]);
    }

    // 2. Fetch expenses in this category
    const { data: expenses, error: expError } = await supabaseService
      .from('expenses')
      .select(`
        id,
        title,
        amount,
        expense_date,
        notes,
        payroll_record_id,
        payroll_records (
          id,
          total_hours,
          hours_pay,
          games_count,
          commission_pay,
          users!staff_id (
            username,
            full_name
          )
        )
      `)
      .eq('category_id', category.id)
      .gte('expense_date', from)
      .lte('expense_date', to)
      .order('expense_date', { ascending: false });

    if (expError) throw expError;

    // 3. Map to UI format
    const salaryReports = (expenses || []).map(exp => {
      const record = exp.payroll_records as any;
      const staff = record?.users;
      
      return {
        id: exp.id,
        title: exp.title,
        username: staff?.username || 'Staff',
        full_name: staff?.full_name || 'Staff Member',
        amount: Number(exp.amount),
        date: exp.expense_date,
        notes: exp.notes,
        total_hours: record?.total_hours || 0,
        hours_pay: record?.hours_pay || 0,
        games_count: record?.games_count || 0,
        commission_pay: record?.commission_pay || 0,
      };
    });

    return NextResponse.json(salaryReports);

  } catch (error) {
    console.error("[ADMIN_SALARIES_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_financials");
