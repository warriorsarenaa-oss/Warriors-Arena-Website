import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get('week_start');
  const weekEnd = searchParams.get('week_end');

  let query = supabaseService.from('staff_schedules').select('*');
  
  if (weekStart) query = query.eq('week_start', weekStart);
  if (weekEnd) query = query.eq('week_end', weekEnd);

  const { data, error } = await query.order('week_start', { ascending: false });

  if (error) return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  return NextResponse.json(data);
}, "manage_users");

export const POST = requirePermission(async (request: Request, { user }) => {
  const body = await request.json();
  const { week_start, week_end, notes } = body;

  const { data, error } = await supabaseService
    .from('staff_schedules')
    .insert({
      week_start,
      week_end,
      notes,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });

  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: "CREATE_SCHEDULE",
    entity_type: "staff_schedule",
    entity_id: data.id,
    after_state: { week_start, week_end }
  });

  return NextResponse.json(data);
}, "manage_users");

export const PATCH = requirePermission(async (request: Request, { user }) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const body = await request.json();
  const { is_published } = body;

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const { data, error } = await supabaseService
    .from('staff_schedules')
    .update({ is_published })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });

  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: "PUBLISH_SCHEDULE",
    entity_type: "staff_schedule",
    entity_id: id,
    after_state: { is_published }
  });

  return NextResponse.json(data);
}, "manage_users");
