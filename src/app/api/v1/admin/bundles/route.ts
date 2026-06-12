import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

/**
 * DB bundles table uses:
 *   is_visible BOOLEAN (not "visibility")
 *   display_placement TEXT (not "placement")
 *   display_placement IN ('landing_featured','landing_secondary','booking_flow_sidebar','hidden')
 */

const CreateBundleSchema = z.object({
  title_en: z.string().min(1),
  title_ar: z.string().min(1),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  game_id: z.string().uuid(),
  duration_minutes: z.number().int().positive(),
  player_count: z.number().int().min(1).max(200),
  pricing_mode: z.enum(["per_player", "fixed_total"]),
  price_value: z.number().min(0),
  image_url: z.string().optional().nullable(),
  // UI sends "visibility" as 'public' | 'hidden' — map to is_visible boolean
  visibility: z.enum(["public", "hidden"]).default("public"),
  // UI sends "placement" — map to display_placement
  placement: z
    .enum(["landing_featured", "landing_secondary", "booking_flow_sidebar", "hidden"])
    .optional()
    .nullable(),
  display_order: z.number().int().default(0),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
});

export const GET = requirePermission(async (_request: Request) => {
  try {
    const { data, error } = await supabaseService
      .from("bundles")
      .select("*, games(id, name_en, name_ar)")
      .order("display_order", { ascending: true });

    if (error) throw error;

    // Normalize DB fields to UI field names for consistency
    const normalized = (data ?? []).map(b => ({
      ...b,
      visibility: b.is_visible ? "public" : "hidden",
      placement: b.display_placement,
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("[ADMIN_BUNDLES_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_bundles");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const parsed = CreateBundleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const { visibility, placement, ...rest } = parsed.data;

    // Auto-generate slug
    const slug = rest.title_en.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    const insertPayload = {
      ...rest,
      slug,
      is_visible: visibility === "public",
      display_placement: placement ?? null,
      is_active: true,
      created_by_user_id: user.id
    };

    const { data: newBundle, error } = await supabaseService
      .from("bundles")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Bundle Insert Error:", error);
      return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }

    // Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabaseService.from("audit_logs").insert({
        action: "create_bundle",
        entity_type: "bundles",
        entity_id: newBundle.id,
        actor_user_id: user.id,
        actor_email: user.email || 'Warriors.arena.eg@gmail.com',
        after_state: newBundle,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    return NextResponse.json({ ...newBundle, visibility, placement }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_BUNDLES_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_bundles");
