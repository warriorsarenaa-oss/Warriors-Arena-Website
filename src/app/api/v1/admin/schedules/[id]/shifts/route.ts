import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { emitEvent } from "@/lib/events/eventBus";

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

  const { data: schedule } = await supabaseService.from('staff_schedules').select('is_published').eq('id', id).single();
  const isPublished = schedule?.is_published;

  // Use the transactional RPC so shift creation + retroactive commission inserts are atomic
  console.log('[ShiftAPI] Calling RPC with:', JSON.stringify({ p_schedule_id: id, p_staff_id: staff_id, p_shift_date: shift_date, p_start_time: start_time, p_end_time: end_time }));
  const { data, error } = await supabaseService.rpc('insert_shift_with_retroactive_commission', {
    p_schedule_id: id,
    p_staff_id: staff_id,
    p_shift_date: shift_date,
    p_start_time: start_time,
    p_end_time: end_time,
    p_notes: notes ?? null,
  });

  if (error || !data) {
    console.error('[ShiftAPI] RPC error FULL:', JSON.stringify(error), 'staff_id received:', staff_id, 'schedule_id:', id);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }

  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: "CREATE_SHIFT",
    entity_type: "staff_shift",
    entity_id: data.id,
    after_state: { staff_id, shift_date, start_time, end_time }
  });

  if (isPublished) {
    await supabaseService.from('schedule_edits').insert({
      schedule_id: id,
      shift_id: data.id,
      affected_staff_id: staff_id,
      edited_by_user_id: user.id,
      edit_type: 'shift_added',
      new_state: data,
    });
    await emitEvent('SCHEDULE_EDITED', 'schedule', id, { type: 'shift_added', shift: data }, user.id);
  }

  return NextResponse.json(data);
}, "manage_users");
