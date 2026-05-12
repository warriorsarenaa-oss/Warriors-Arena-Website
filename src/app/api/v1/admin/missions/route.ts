import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async () => {
  try {
    const supabase = createSupabaseService();
    const { data, error } = await supabase
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
    const supabase = createSupabaseService();

    const { data, error } = await supabase
      .from("special_missions")
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    // After successful save, revalidate public pages
    try {
      revalidatePath('/', 'layout');
    } catch (err) {
      console.error('Revalidation error:', err);
    }

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
