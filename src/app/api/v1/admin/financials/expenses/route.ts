import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";

// GET: List expenses in a date range
export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json({ error: "Date range required" }, { status: 400 });
    }

    const { data, error } = await supabaseService
      .from('expenses')
      .select('*')
      .gte('expense_date', from)
      .lte('expense_date', to)
      .order('expense_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_EXPENSES_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_financials");

// POST: Add new expense
export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const { amount, description, date } = body;

    if (!amount || !description || !date) {
      return NextResponse.json({ error: "Amount, description and date are required" }, { status: 400 });
    }

    // Prepare data - Mapping to specific database column names from migration
    const insertData: any = {
      amount: Number(amount),
      title: description,            // Database uses 'title'
      expense_date: date,             // Database uses 'expense_date'
      created_by_user_id: user.id     // Database uses 'created_by_user_id'
    };

    const { data, error } = await supabaseService
      .from('expenses')
      .insert(insertData)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Supabase Insert Error:", error);
      return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }

    // Audit Log
    await logAuditAction({
      request,
      actor_user_id: user.id,
      actor_email: user.email,
      action: "add_expense",
      entity_type: "expenses",
      entity_id: data?.id,
      after_state: data
    });

    return NextResponse.json({ success: true, expense: data });
  } catch (error) {
    console.error("[ADMIN_EXPENSES_POST_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_financials");
