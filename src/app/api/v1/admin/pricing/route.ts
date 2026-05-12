import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

const UpdatePricingSchema = z.object({
  game_id: z.string().uuid(),
  duration_minutes: z.number().int(),
  price_per_player: z.number().min(0).max(10000),
  pricing_type: z.enum(['time', 'ammo']).default('time'),
  ammo_count: z.number().int().optional().nullable(),
  duration_minutes_display: z.string().optional().nullable()
});

export const GET = requirePermission(async (request: Request) => {
  try {
    const { data, error } = await supabaseService
      .from('game_pricing')
      .select(`
        id,
        game_id,
        duration_minutes,
        price_per_player,
        pricing_type,
        ammo_count,
        duration_minutes_display,
        is_active,
        created_at,
        games ( name_en, slug )
      `)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_PRICING_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_pricing");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const parsed = UpdatePricingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { 
      game_id, 
      duration_minutes, 
      price_per_player, 
      pricing_type, 
      ammo_count, 
      duration_minutes_display 
    } = parsed.data;

    // 1. Find existing active price
    const { data: existingActive, error: fetchError } = await supabaseService
      .from('game_pricing')
      .select('*')
      .eq('game_id', game_id)
      .eq('duration_minutes', duration_minutes)
      .eq('is_active', true)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is no rows returned, which is fine for a new game
      throw fetchError;
    }

    // If price hasn't changed, return early
    if (existingActive && Number(existingActive.price_per_player) === price_per_player) {
      return NextResponse.json(existingActive);
    }

    // 2. Deactivate old price (if exists)
    if (existingActive) {
      const { error: deactivateError } = await supabaseService
        .from('game_pricing')
        .update({ is_active: false })
        .eq('id', existingActive.id);

      if (deactivateError) throw deactivateError;
    }

    // 3. Insert new active price
    const { data: newPrice, error: insertError } = await supabaseService
      .from('game_pricing')
      .insert({
        game_id,
        duration_minutes,
        price_per_player,
        pricing_type,
        ammo_count,
        duration_minutes_display,
        is_active: true
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Write audit log
    await supabaseService.from("audit_logs").insert({
      action: "update_pricing",
      entity_type: "game_pricing",
      entity_id: newPrice.id,
      actor_user_id: user.id,
      before_state: existingActive || null,
      after_state: newPrice,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(newPrice);
  } catch (error) {
    console.error("[ADMIN_PRICING_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_pricing");
