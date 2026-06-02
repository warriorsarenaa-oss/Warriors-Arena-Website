import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const PUT = requirePermission(
  async (request: Request, { user, params }: { user: any; params: { id: string } }) => {
    try {
      const { id } = await params;
      const body = await request.json();

      const { data: before } = await supabaseService
        .from("special_missions")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabaseService
        .from("special_missions")
        .update(body)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await logAuditAction({
        actor_user_id: user.id,
        actor_email: user.email,
        action: "update_mission",
        entity_type: "special_missions",
        entity_id: id,
        before_state: before,
        after_state: data,
        request,
      });

      const { revalidatePath } = await import('next/cache');
      try {
        revalidatePath('/', 'layout');
      } catch (err) {
        console.error('Revalidation error:', err);
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("[ADMIN_MISSION_PUT_ERROR]", error);
      return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
  },
  "manage_content"
);

export const DELETE = requirePermission(
  async (request: Request, { user, params }: { user: any; params: { id: string } }) => {
    try {
      const { id } = await params;

      // Block deletion if active bookings reference this mission
      const { count, error: countError } = await supabaseService
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("special_mission_id", id);

      if (countError) throw countError;

      if (count && count > 0) {
        return NextResponse.json(
          { error: "Cannot delete mission with active bookings" },
          { status: 400 }
        );
      }

      const { data: before } = await supabaseService
        .from("special_missions")
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabaseService.from("special_missions").delete().eq("id", id);

      if (error) throw error;

      await logAuditAction({
        actor_user_id: user.id,
        actor_email: user.email,
        action: "delete_mission",
        entity_type: "special_missions",
        entity_id: id,
        before_state: before,
        request,
      });

      const { revalidatePath } = await import('next/cache');
      try {
        revalidatePath('/', 'layout');
      } catch (err) {
        console.error('Revalidation error:', err);
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[ADMIN_MISSION_DELETE_ERROR]", error);
      return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
  },
  "manage_content"
);
