import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

const UpdateBundleSchema = z.object({
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  game_id: z.string().uuid().optional(),
  duration_minutes: z.number().int().positive().optional(),
  player_count: z.number().int().min(1).max(50).optional(),
  pricing_mode: z.enum(["per_player", "fixed_total"]).optional(),
  price_value: z.number().min(0).optional(),
  image_url: z.string().optional().nullable(),
  // UI sends "visibility" ('public'|'hidden') → mapped to is_visible boolean
  visibility: z.enum(["public", "hidden"]).optional(),
  // UI sends "placement" → mapped to display_placement
  placement: z
    .enum(["landing_featured", "landing_secondary", "booking_flow_sidebar", "hidden"])
    .optional()
    .nullable(),
  display_order: z.number().int().optional(),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const PATCH = requirePermission(async (request: Request, { user, params }) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateBundleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const { data: existingBundle, error: fetchError } = await supabaseService
      .from("bundles")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Map UI field names to DB column names
    const { visibility, placement, ...rest } = parsed.data;
    const updatePayload: Record<string, unknown> = { ...rest };
    if (visibility !== undefined) updatePayload.is_visible = visibility === "public";
    if (placement !== undefined) updatePayload.display_placement = placement;

    const { data: updatedBundle, error: updateError } = await supabaseService
      .from("bundles")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabaseService.from("audit_logs").insert({
        action: "update_bundle",
        entity_type: "bundles",
        entity_id: id,
        actor_user_id: user.id,
        actor_email: user.email || 'admin@warriors-arena.com',
        before_state: existingBundle,
        after_state: updatedBundle,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    return NextResponse.json({
      ...updatedBundle,
      visibility: updatedBundle.is_visible ? "public" : "hidden",
      placement: updatedBundle.display_placement,
    });
  } catch (error) {
    console.error("[ADMIN_BUNDLES_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_bundles");

export const DELETE = requirePermission(async (request: Request, { user, params }) => {
  try {
    const { id } = await params;

    const { data: existingBundle, error: fetchError } = await supabaseService
      .from("bundles")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Perform a hard delete for "Vanish" behavior
    const { error: deleteError } = await supabaseService
      .from("bundles")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabaseService.from("audit_logs").insert({
        action: "delete_bundle",
        entity_type: "bundles",
        entity_id: id,
        actor_user_id: user.id,
        actor_email: user.email || 'admin@warriors-arena.com',
        before_state: existingBundle,
        after_state: null,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_BUNDLES_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_bundles");
