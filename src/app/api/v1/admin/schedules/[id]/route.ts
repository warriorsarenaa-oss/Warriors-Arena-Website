import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const PATCH = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;
  const body = await request.json();
  const { is_published, notes } = body;

  const updateData: any = {};
  if (is_published !== undefined) updateData.is_published = is_published;
  if (notes !== undefined) updateData.notes = notes;

  const { data, error } = await supabaseService
    .from('staff_schedules')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });

  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: is_published ? "PUBLISH_SCHEDULE" : "UPDATE_SCHEDULE",
    entity_type: "staff_schedule",
    entity_id: id,
    after_state: updateData
  });

  return NextResponse.json(data);
}, "manage_users");

export const DELETE = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;

  const { error } = await supabaseService
    .from('staff_schedules')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });

  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: "DELETE_SCHEDULE",
    entity_type: "staff_schedule",
    entity_id: id
  });

  return NextResponse.json({ success: true });
}, "manage_users");
