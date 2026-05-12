import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async () => {
  try {
    const { data, error } = await supabaseService
      .from("special_missions")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_MISSIONS_GET_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();

    const { data, error } = await supabaseService
      .from("special_missions")
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    await logAuditAction({
      actor_user_id: user.id,
      actor_email: user.email,
      action: "create_mission",
      entity_type: "special_missions",
      entity_id: data.id,
      after_state: data,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_MISSIONS_POST_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");
