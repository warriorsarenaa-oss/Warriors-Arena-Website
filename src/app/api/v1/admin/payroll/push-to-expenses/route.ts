import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { logAuditAction } from "@/lib/admin/audit-log";

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const { week_start } = await request.json();

    if (!week_start) {
      return NextResponse.json({ error: "week_start required" }, { status: 400 });
    }

    // 1. Find payroll records for this week
    const { data: allRecords, error: recordsError } = await supabaseService
      .from('payroll_records')
      .select('*, users!staff_id(full_name)')
      .eq('week_start', week_start);

    if (recordsError) throw recordsError;

    if (!allRecords || allRecords.length === 0) {
      return NextResponse.json({ error: "No payroll records found for this week." }, { status: 400 });
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
      const totalPaid = Number(record.total_paid_so_far || 0);
      const previouslyPushed = Number(record.previously_pushed_to_expenses || 0);
      const netNewExpense = totalPaid - previouslyPushed;

      // Only push positive net new expenses
      if (netNewExpense > 0) {
        totalAmount += netNewExpense;
        
        const staffName = (record as any).users?.full_name || 'Staff';
        const title = `Payroll Settlement: ${staffName} (Week ${week_start})`;
        const notes = `Delta Payment - Total Paid: ${totalPaid} EGP, Previously Pushed: ${previouslyPushed} EGP`;

        const expenseData = {
          amount: netNewExpense,
          title,
          expense_date: new Date().toISOString().substring(0, 10),
          category_id: categoryId,
          payroll_record_id: record.id,
          created_by_user_id: user.id,
          currency: 'EGP',
          notes
        };

        const { error: insertError } = await supabaseService
          .from('expenses')
          .insert(expenseData);
          
        if (insertError) throw insertError;

        // Update previously_pushed_to_expenses
        const { error: updateError } = await supabaseService
          .from('payroll_records')
          .update({ previously_pushed_to_expenses: totalPaid })
          .eq('id', record.id);
          
        if (updateError) throw updateError;

        pushedCount++;
      }
    }

    if (pushedCount === 0) {
       return NextResponse.json({ 
        success: true, 
        message: "No new payments to push. Everything is up to date.",
        count: 0, 
        amount: 0 
      });
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
