import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

export const GET = requirePermission(async (_request: Request) => {
  try {
    const { data, error } = await supabaseService
      .from("games")
      .select("*, game_pricing(id, duration_minutes, price_per_player, is_active)")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error: any) {
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
  display_order: z.number().int().default(0),
  pricing: z.array(z.object({
    duration_minutes: z.union([z.literal(30), z.literal(60)]),
    price_per_player: z.number().min(0)
  })).min(1, "At least one price is required")
});

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const parsed = CreateGameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const { pricing, ...gameData } = parsed.data;

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
      duration_minutes: p.duration_minutes,
      price_per_player: p.price_per_player,
      is_active: true
    }));

    const { error: pricingError } = await supabaseService
      .from('game_pricing')
      .insert(pricingRows);

    if (pricingError) {
      console.error("Pricing Insert Error:", pricingError);
      // Rollback game if pricing fails
      await supabaseService.from('games').delete().eq('id', newGame.id);
      return NextResponse.json({ error: pricingError.message }, { status: 500 });
    }

    // 3. Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabaseService.from('audit_logs').insert({
        action: 'create_game',
        entity_type: 'games',
        entity_id: newGame.id,
        actor_user_id: user.id,
        actor_email: user.email || 'admin@warriors-arena.com',
        after_state: { ...newGame, pricing },
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    return NextResponse.json(newGame, { status: 201 });
  } catch (error: any) {
    console.error("[ADMIN_GAMES_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_games");
