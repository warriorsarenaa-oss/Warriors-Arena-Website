import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { z } from "zod";
import { logAuditAction } from "@/lib/admin/audit-log";

const eventSchema = z.object({
  event_date: z.string().optional(),
  title: z.string().min(1).optional(),
  client_name: z.string().nullable().optional(),
  client_phone: z.string().nullable().optional(),
  total_revenue: z.number().positive().optional(),
  notes: z.string().nullable().optional()
});

export const PUT = requirePermission(async (request: Request, context: any) => {
  try {
    const { params } = context;
    const id = await params.id;
    const body = await request.json();
    const validatedData = eventSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: "Validation failed", details: validatedData.error.format() }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseService
      .from('arena_events')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updates = {
      ...validatedData.data,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error: updateError } = await supabaseService
      .from('arena_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    const session = context.session;
    const userId = session?.user?.id;

    await logAuditAction({
      actor_user_id: userId,
      actor_email: session?.user?.email || 'unknown',
      action: 'update_event',
      entity_type: 'arena_event',
      entity_id: id,
      before_state: existing,
      after_state: updated
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADMIN_EVENTS_PUT_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");

export const DELETE = requirePermission(async (request: Request, context: any) => {
  try {
    const { params } = context;
    const id = await params.id;

    const { data: existing, error: fetchError } = await supabaseService
      .from('arena_events')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updates = {
      is_deleted: true,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseService
      .from('arena_events')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;

    const session = context.session;
    const userId = session?.user?.id;

    await logAuditAction({
      actor_user_id: userId,
      actor_email: session?.user?.email || 'unknown',
      action: 'delete_event',
      entity_type: 'arena_event',
      entity_id: id,
      before_state: existing,
      after_state: { is_deleted: true }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ADMIN_EVENTS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");
