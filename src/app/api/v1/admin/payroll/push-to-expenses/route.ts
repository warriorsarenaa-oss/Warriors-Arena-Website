import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { logAuditAction } from "@/lib/admin/audit-log";

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const { week_start, week_end } = await request.json();

    // 1. Find paid payroll records for this week that aren't pushed yet
    const { data: records, error: fetchError } = await supabaseService.rpc('fn_get_unpushed_payroll', {
      p_week_start: week_start
    });
    
    // If RPC doesn't exist, we fallback to a query (but RPC is safer for complex join logic)
    // Let's assume we might need a query here for now or I'll create the RPC.
    
    // Fallback Query Logic:
    const { data: allRecords, error: recordsError } = await supabaseService
      .from('payroll_records')
      .select('*, users!staff_id(full_name)')
      .eq('week_start', week_start)
      .eq('is_paid', true);

    if (recordsError) throw recordsError;

    // 2. Filter out those already in expenses
    const { data: existingExpenses } = await supabaseService
      .from('expenses')
      .select('payroll_record_id')
      .not('payroll_record_id', 'is', null);

    const pushedIds = new Set((existingExpenses || []).map(e => e.payroll_record_id));
    const unpushedRecords = allRecords.filter(r => !pushedIds.has(r.id));

    if (unpushedRecords.length === 0) {
      return NextResponse.json({ error: "No new paid records to push for this week." }, { status: 400 });
    }

    // 2. Get Payroll Category ID
    const { data: category } = await supabaseService
      .from('expense_categories')
      .select('id')
      .eq('name', 'Payroll')
      .single();

    let categoryId = category?.id;

    if (!categoryId) {
      // Fallback to first available category if Payroll is missing
      const { data: firstCat } = await supabaseService.from('expense_categories').select('id').limit(1).single();
      categoryId = firstCat?.id;
    }

    if (!categoryId) {
      return NextResponse.json({ error: "No expense categories found in system." }, { status: 500 });
    }

    let totalAmount = 0;
    let pushedCount = 0;

    for (const record of allRecords) {
      totalAmount += Number(record.total_pay);
      
      const staffName = (record as any).users?.full_name || 'Staff';
      const title = `Payroll Settlement: ${staffName} (Week ${week_start})`;
      const notes = `Hours: ${record.total_hours}h (${record.hours_pay} EGP), Games: ${record.games_count} (${record.commission_pay} EGP)`;

      const expenseData = {
        amount: record.total_pay,
        title,
        expense_date: new Date().toISOString().substring(0, 10),
        category_id: categoryId,
        payroll_record_id: record.id,
        created_by_user_id: user.id,
        notes
      };

      // Check if expense already exists for this payroll record
      const { data: existing } = await supabaseService
        .from('expenses')
        .select('id')
        .eq('payroll_record_id', record.id)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabaseService
          .from('expenses')
          .update(expenseData)
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabaseService
          .from('expenses')
          .insert(expenseData);
        if (insertError) throw insertError;
      }
      pushedCount++;
    }

    await logAuditAction({
      actor_user_id: user.id,
      actor_email: user.email,
      action: "PUSH_PAYROLL_TO_EXPENSES",
      entity_type: "expense",
      entity_id: "bulk",
      after_state: { count: pushedCount, total: totalAmount },
      request,
    });

    return NextResponse.json({ 
      success: true, 
      count: pushedCount, 
      amount: totalAmount 
    });

  } catch (error) {
    console.error("[PAYROLL_PUSH_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_financials");
