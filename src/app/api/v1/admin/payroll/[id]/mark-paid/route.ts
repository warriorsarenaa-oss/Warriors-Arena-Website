import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { roundEGP } from "@/lib/utils/format";
import { format } from "date-fns";

export const POST = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;
  const body = await request.json();
  const { payment_method, notes } = body;

  // 1. Mark payroll as paid
  const { data: payroll, error: payrollError } = await supabaseService
    .from('payroll_records')
    .update({
      is_paid: true,
      paid_at: new Date().toISOString(),
      paid_by: user.id,
      payment_method,
      notes,
    })
    .eq('id', id)
    .select(`
      *,
      users!staff_id (
        full_name
      )
    `)
    .single();

  if (payrollError) {
    console.error('[MARK_PAID_ERROR] Supabase error:', JSON.stringify(payrollError, null, 2));
    return NextResponse.json({ error: payrollError.message }, { status: 500 });
  }

  if (!payroll) {
    return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
  }

  // hours_pay is a nullable DB column written by the recalculate endpoint.
  // Fall back to recomputing if null (e.g. first run before recalculate was called).
  const hoursPay   = roundEGP(Number((payroll as any).hours_pay ?? (Number(payroll.total_hours) * Number(payroll.hourly_rate))));
  const commPay    = roundEGP(Number((payroll as any).commission_pay || 0));
  const totalPay   = roundEGP(Number(payroll.total_calculated_payroll || 0));
  const staffName  = (payroll as any).users?.full_name ?? 'Unknown';

  // 2. Get Payroll category ID
  const { data: category } = await supabaseService
    .from('expense_categories')
    .select('id')
    .eq('name', 'Payroll')
    .single();

  // 3. Create expense record
  if (category) {
    const { error: expenseError } = await supabaseService.from('expenses').insert({
      title: `Staff payroll - ${staffName} (${payroll.week_start})`,
      category_id: category.id,
      amount: totalPay,
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      notes: [
        `Hours: ${payroll.total_hours}h × ${payroll.hourly_rate} EGP = ${hoursPay.toFixed(2)} EGP`,
        `Commission: ${payroll.games_count} games = ${commPay.toFixed(2)} EGP`,
        `Total: ${totalPay.toFixed(2)} EGP`,
        payment_method ? `Payment method: ${payment_method}` : null,
        notes ?? null,
      ].filter(Boolean).join(' | '),
      created_by_user_id: user.id,
    });

    if (expenseError) {
      // Non-fatal — log but don't block the payroll mark-paid response
      console.error('[MARK_PAID_EXPENSE_ERROR] Failed to create expense record:', JSON.stringify(expenseError, null, 2));
    }
  }

  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: "PAYROLL_MARKED_PAID",
    entity_type: "payroll_record",
    entity_id: id,
    after_state: { total_calculated_payroll: totalPay, staff: staffName }
  });

  return NextResponse.json({ success: true, payroll });
}, "manage_financials");
