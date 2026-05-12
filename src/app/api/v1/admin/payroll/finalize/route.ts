import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { logAuditAction } from "@/lib/admin/audit-log";

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const { 
      staff_id, 
      week_start, 
      week_end, 
      total_hours, 
      hourly_rate, 
      games_count, 
      commission_rate,
      total_revenue,
      is_paid 
    } = body;

    // Check for existing record
    const { data: existing } = await supabaseService
      .from('payroll_records')
      .select('id')
      .eq('staff_id', staff_id)
      .eq('week_start', week_start)
      .maybeSingle();

    let result;
    const payload = {
      staff_id,
      week_start,
      week_end,
      total_hours,
      hourly_rate,
      games_count,
      commission_rate: commission_rate || 0,
      total_revenue: total_revenue || 0,
      is_paid,
      paid_at: is_paid ? new Date().toISOString() : null,
      paid_by: is_paid ? user.id : null,
    };

    if (existing) {
      result = await supabaseService
        .from('payroll_records')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabaseService
        .from('payroll_records')
        .insert(payload)
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) throw error;

    await logAuditAction({
      actor_user_id: user.id,
      actor_email: user.email,
      action: "FINALIZE_PAYROLL",
      entity_type: "payroll_record",
      entity_id: data.id,
      after_state: data
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[PAYROLL_FINALIZE_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_financials");
