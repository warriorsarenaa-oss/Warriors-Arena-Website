import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async (request: Request, { params }) => {
  const { id } = await params;
  const { data, error } = await supabaseService
    .from('staff_shifts')
    .select(`
      *,
      users!staff_id (
        id,
        full_name,
        hourly_rate,
        commission_rate
      )
    `)
    .eq('schedule_id', id)
    .order('shift_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  return NextResponse.json(data);
}, "manage_users");

export const POST = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;
  const body = await request.json();
  const { staff_id, shift_date, start_time, end_time, notes } = body;

  const { data, error } = await supabaseService
    .from('staff_shifts')
    .insert({
      schedule_id: id,
      staff_id,
      shift_date,
      start_time,
      end_time,
      notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });

  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: "CREATE_SHIFT",
    entity_type: "staff_shift",
    entity_id: data.id,
    after_state: { staff_id, shift_date, start_time, end_time }
  });

  return NextResponse.json(data);
}, "manage_users");
