import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const DELETE = requirePermission(async (request: Request, { user, params }) => {
  const { id } = await params;

  // 1. Get shift details for audit
  const { data: shift } = await supabaseService
    .from('staff_shifts')
    .select('*')
    .eq('id', id)
    .single();

  if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });

  // 2. Delete shift
  const { error } = await supabaseService
    .from('staff_shifts')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });

  await logAuditAction({
    actor_user_id: user.id,
    actor_email: user.email,
    action: "DELETE_SHIFT",
    entity_type: "staff_shift",
    entity_id: id,
    before_state: shift
  });

  return NextResponse.json({ success: true });
}, "manage_users");
