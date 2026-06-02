import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { createSupabaseService } from "@/lib/db/supabase-service";

const UpdateGameSchema = z.object({
  name_en: z.string().optional(),
  name_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  icon_url: z.string().optional(),
  hero_image_url: z.string().optional(),
  stat1_name: z.string().optional(),
  stat1_value: z.number().optional(),
  stat2_name: z.string().optional(),
  stat2_value: z.number().optional(),
  stat3_name: z.string().optional(),
  stat3_value: z.number().optional(),
  stat1_name_ar: z.string().optional(),
  stat2_name_ar: z.string().optional(),
  stat3_name_ar: z.string().optional(),
  max_players: z.number().int().optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
  pricing: z.array(z.object({
    pricing_type: z.enum(['time', 'ammo']).default('time'),
    duration_minutes: z.number().int(),
    price_per_player: z.number().min(0),
    ammo_count: z.number().int().optional().nullable(),
    duration_minutes_display: z.string().optional().nullable()
  })).optional(),
  refill_packages: z.array(z.object({
    ammo_count: z.number().int(),
    price_per_player: z.number().min(0)
  })).optional(),
});

export const PATCH = requirePermission(async (request: Request, { user, params }: any) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateGameSchema.safeParse(body);
    const supabase = createSupabaseService();

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    // Get before state
    const { data: existingGame, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { pricing, refill_packages, ...gameData } = parsed.data;

    // Update Game
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update(gameData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update Pricing if provided
    if (pricing) {
      // Mark old as inactive
      await supabase
        .from('game_pricing')
        .update({ is_active: false })
        .eq('game_id', id);

      // Insert new
      const pricingRows = pricing.map(p => ({
        game_id: id,
        pricing_type: p.pricing_type,
        duration_minutes: p.duration_minutes,
        price_per_player: p.price_per_player,
        ammo_count: p.ammo_count,
        duration_minutes_display: p.duration_minutes_display,
        is_active: true
      }));

      const { error: pricingError } = await supabase
        .from('game_pricing')
        .insert(pricingRows);

      if (pricingError) throw pricingError;
    }

    // Update Refill Packages if provided
    if (refill_packages) {
      // Mark old as inactive (or delete if you prefer, but inactive is safer for history)
      await supabase
        .from('refill_packages')
        .update({ is_active: false })
        .eq('game_id', id);

      if (refill_packages.length > 0) {
        const refillRows = refill_packages.map(r => ({
          game_id: id,
          ammo_count: r.ammo_count,
          price_per_player: r.price_per_player,
          is_active: true
        }));

        const { error: refillError } = await supabase
          .from('refill_packages')
          .insert(refillRows);

        if (refillError) throw refillError;
      }
    }

    // 3. Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabase.from('audit_logs').insert({
        action: 'update_game',
        entity_type: 'games',
        entity_id: id,
        actor_user_id: user.id,
        actor_email: user.email || 'admin@warriors-arena.com',
        before_state: existingGame,
        after_state: updatedGame,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    // After successful save, revalidate public pages
    try {
      revalidatePath('/', 'layout');
    } catch (err) {
      console.error('Revalidation error:', err);
    }

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("[ADMIN_GAMES_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_games");

export const DELETE = requirePermission(async (request: Request, { user, params }: any) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const supabase = createSupabaseService();

    // Get before state
    const { data: existingGame, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 1. Delete associated pricing first (FK constraint)
    const { error: pricingDeleteError } = await supabase
      .from('game_pricing')
      .delete()
      .eq('game_id', id);

    if (pricingDeleteError) throw pricingDeleteError;

    // 2. Delete the game itself
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 3. Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabase.from('audit_logs').insert({
        action: 'delete_game',
        entity_type: 'games',
        entity_id: id,
        actor_user_id: user.id,
        actor_email: user.email || 'admin@warriors-arena.com',
        before_state: existingGame,
        after_state: null,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    // After successful delete, revalidate public pages
    try {
      revalidatePath('/', 'layout');
    } catch (err) {
      console.error('Revalidation error:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_GAMES_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_games");
