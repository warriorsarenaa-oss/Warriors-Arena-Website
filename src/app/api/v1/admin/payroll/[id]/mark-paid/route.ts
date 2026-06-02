import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";

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

  if (payrollError) return NextResponse.json({ error: payrollError.message }, { status: 500 });

  // 2. Get Payroll category ID
  const { data: category } = await supabaseService
    .from('expense_categories')
    .select('id')
    .eq('name', 'Payroll')
    .single();

  // 3. Create expense record
  if (category) {
    await supabaseService.from('expenses').insert({
      title: `Staff payroll - ${(payroll as any).users.full_name} (${payroll.week_start})`,
      category_id: category.id,
      amount: payroll.total_pay,
      expense_date: new Date().toISOString().split('T')[0],
      notes: [
        `Hours: ${payroll.total_hours}h × ${payroll.hourly_rate} EGP = ${payroll.hours_pay} EGP`,
        `Commission: ${payroll.games_count} games = ${payroll.commission_pay} EGP`,
        `Total: ${payroll.total_pay} EGP`,
        payment_method ? `Payment method: ${payment_method}` : null,
        notes ?? null,
      ].filter(Boolean).join(' | '),
      created_by_user_id: user.id,
    });
  }

  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: "PAYROLL_MARKED_PAID",
    entity_type: "payroll_record",
    entity_id: id,
    after_state: { total_pay: payroll.total_pay, staff: (payroll as any).users.full_name }
  });

  return NextResponse.json({ success: true, payroll });
}, "manage_financials");
