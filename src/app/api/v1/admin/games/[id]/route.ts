import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

const UpdateGameSchema = z.object({
  name_en: z.string().optional(),
  name_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  icon_url: z.string().optional(),
  hero_image_url: z.string().optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
  pricing: z.array(z.object({
    duration_minutes: z.number().int(),
    price_per_player: z.number().min(0)
  })).optional(),
});

export const PATCH = requirePermission(async (request: Request, { user, params }: any) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateGameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    // Get before state
    const { data: existingGame, error: fetchError } = await supabaseService
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { pricing, ...gameData } = parsed.data;

    // Update Game
    const { data: updatedGame, error: updateError } = await supabaseService
      .from('games')
      .update(gameData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update Pricing if provided
    if (pricing) {
      // Mark old as inactive
      await supabaseService
        .from('game_pricing')
        .update({ is_active: false })
        .eq('game_id', id);

      // Insert new
      const pricingRows = pricing.map(p => ({
        game_id: id,
        duration_minutes: p.duration_minutes,
        price_per_player: p.price_per_player,
        is_active: true
      }));

      const { error: pricingError } = await supabaseService
        .from('game_pricing')
        .insert(pricingRows);

      if (pricingError) throw pricingError;
    }

    // 3. Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabaseService.from('audit_logs').insert({
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

    return NextResponse.json(updatedGame);
  } catch (error: any) {
    console.error("[ADMIN_GAMES_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_games");

export const DELETE = requirePermission(async (request: Request, { user, params }: any) => {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Get before state
    const { data: existingGame, error: fetchError } = await supabaseService
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 1. Delete associated pricing first (FK constraint)
    const { error: pricingDeleteError } = await supabaseService
      .from('game_pricing')
      .delete()
      .eq('game_id', id);

    if (pricingDeleteError) throw pricingDeleteError;

    // 2. Delete the game itself
    const { error: deleteError } = await supabaseService
      .from('games')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 3. Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabaseService.from('audit_logs').insert({
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ADMIN_GAMES_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_games");
