import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

export const DELETE = requirePermission(async (request: Request, { user, params }) => {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // Get before state
    const { data: existingRow, error: fetchError } = await supabaseService
      .from('operating_hours')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRow) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    if (existingRow.scope === 'default') {
      return NextResponse.json({ error: "Cannot delete default operating hours" }, { status: 403 });
    }

    // Delete
    const { error: deleteError } = await supabaseService
      .from('operating_hours')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Write audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabaseService.from("audit_logs").insert({
        action: "delete_operating_hours",
        entity_type: "operating_hours",
        entity_id: id,
        actor_user_id: user.id,
        actor_email: user.email || 'admin@warriors-arena.com',
        before_state: existingRow,
        after_state: null,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ADMIN_HOURS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_hours");
