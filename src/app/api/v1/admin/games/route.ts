import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

export const GET = requirePermission(async (_request: Request) => {
  try {
    const { data, error } = await supabaseService
      .from("games")
      .select(`
        *,
        game_pricing(
          id, 
          duration_minutes, 
          price_per_player, 
          is_active,
          pricing_type,
          ammo_count,
          duration_minutes_display
        ),
        refill_packages(*)
      `)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("[ADMIN_GAMES_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_games");

const CreateGameSchema = z.object({
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
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
  display_order: z.number().int().default(0),
  pricing: z.array(z.object({
    pricing_type: z.enum(['time', 'ammo']).default('time'),
    duration_minutes: z.number().int(),
    price_per_player: z.number().min(0),
    duration_minutes_display: z.string().optional().nullable(),
    ammo_count: z.number().int().optional().nullable(),
  })).min(1, "At least one price is required"),
  refill_packages: z.array(z.object({
    ammo_count: z.number().int(),
    price_per_player: z.number().min(0)
  })).optional().default([])
});

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const parsed = CreateGameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const { pricing, refill_packages, ...gameData } = parsed.data;

    // Helper to generate slug
    const slug = gameData.name_en.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    // 1. Create Game
    const { data: newGame, error: gameError } = await supabaseService
      .from('games')
      .insert({ 
        ...gameData, 
        slug,
        is_active: true
      })
      .select()
      .single();

    if (gameError) {
      console.error("Game Insert Error:", gameError);
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }

    // 2. Create Pricing
    const pricingRows = pricing.map(p => ({
      game_id: newGame.id,
      pricing_type: p.pricing_type,
      duration_minutes: p.duration_minutes,
      price_per_player: p.price_per_player,
      ammo_count: p.ammo_count,
      duration_minutes_display: p.duration_minutes_display,
      is_active: true
    }));

    const { error: pricingError } = await supabaseService
      .from('game_pricing')
      .insert(pricingRows);

    if (pricingError) {
      console.error("Pricing Insert Error:", pricingError);
      await supabaseService.from('games').delete().eq('id', newGame.id);
      return NextResponse.json({ error: pricingError.message }, { status: 500 });
    }

    // 3. Create Refill Packages
    if (refill_packages && refill_packages.length > 0) {
      const refillRows = refill_packages.map(r => ({
        game_id: newGame.id,
        ammo_count: r.ammo_count,
        price_per_player: r.price_per_player,
        is_active: true
      }));

      const { error: refillError } = await supabaseService
        .from('refill_packages')
        .insert(refillRows);

      if (refillError) {
        console.error("Refill Insert Error:", refillError);
        // Non-critical, just log it
      }
    }

    // 3. Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabaseService.from('audit_logs').insert({
        action: 'create_game',
        entity_type: 'games',
        entity_id: newGame.id,
        actor_user_id: user.id,
        actor_email: user.email || 'Warriors.arena.eg@gmail.com',
        after_state: { ...newGame, pricing },
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    // Force revalidate landing page
    const { revalidatePath } = await import('next/cache');
    try {
      revalidatePath('/', 'layout');
    } catch (revalidateErr) {
      console.warn("Revalidation failed:", revalidateErr);
    }

    return NextResponse.json(newGame, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_GAMES_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_games");
