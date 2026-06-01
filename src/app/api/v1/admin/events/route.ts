import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { z } from "zod";
import { logAuditAction } from "@/lib/admin/audit-log";

const eventSchema = z.object({
  event_date: z.string(),
  title: z.string().min(1),
  client_name: z.string().nullable().optional(),
  client_phone: z.string().nullable().optional(),
  total_revenue: z.number().positive(),
  notes: z.string().nullable().optional()
});

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    if (!fromStr || !toStr) {
      return NextResponse.json({ error: "from and to dates are required" }, { status: 400 });
    }

    const { data: events, error } = await supabaseService
      .from('arena_events')
      .select('id, event_date, title, client_name, client_phone, total_revenue, currency, notes, created_by_user_id, created_at, updated_at')
      .gte('event_date', fromStr)
      .lte('event_date', toStr)
      .eq('is_deleted', false)
      .order('event_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(events);
  } catch (error) {
    console.error("[ADMIN_EVENTS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_financials");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const validatedData = eventSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: "Validation failed", details: validatedData.error.format() }, { status: 400 });
    }

    const userId = user.id;

    const newEvent = {
      ...validatedData.data,
      created_by_user_id: userId
    };

    const { data: insertedEvent, error } = await supabaseService
      .from('arena_events')
      .insert(newEvent)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction({
      actor_user_id: userId,
      actor_email: user.email || 'unknown',
      action: 'create_event',
      entity_type: 'arena_event',
      entity_id: insertedEvent.id,
      before_state: null,
      after_state: insertedEvent
    });

    return NextResponse.json(insertedEvent, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_EVENTS_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");
