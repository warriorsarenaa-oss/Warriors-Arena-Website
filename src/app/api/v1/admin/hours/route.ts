import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

/**
 * Hours API — operating_hours table
 *
 * DB schema uses:
 *   scope IN ('default', 'day_of_week', 'exact_date')
 *   day_of_week INT (0 = Sunday) — set when scope = 'day_of_week'
 *   exact_date  DATE             — set when scope = 'exact_date'
 *
 * POST body:
 *   { scope, day_of_week?, exact_date?, open_time?, close_time?, is_closed }
 */

const HoursSchema = z
  .object({
    scope: z.enum(["default", "day_of_week", "exact_date"]),
    day_of_week: z.number().int().min(0).max(6).optional().nullable(),
    exact_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    open_time: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional()
      .nullable(),
    close_time: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional()
      .nullable(),
    is_closed: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.is_closed && (!data.open_time || !data.close_time)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["open_time"],
        message: "open_time and close_time are required when not closed",
      });
    }
    if (data.scope === "day_of_week" && data.day_of_week == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["day_of_week"],
        message: "day_of_week is required for scope='day_of_week'",
      });
    }
    if (data.scope === "exact_date" && !data.exact_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exact_date"],
        message: "exact_date is required for scope='exact_date'",
      });
    }
  });

export const GET = requirePermission(async (_request: Request) => {
  try {
    const { data, error } = await supabaseService
      .from("operating_hours")
      .select("*")
      .order("scope")
      .order("day_of_week", { ascending: true, nullsFirst: false })
      .order("exact_date", { ascending: true, nullsFirst: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[ADMIN_HOURS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_hours");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const parsed = HoursSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { scope, day_of_week, exact_date, open_time, close_time, is_closed } = parsed.data;

    // Build the insert/update payload (only include scope-specific columns)
    const payload: Record<string, unknown> = { scope, open_time, close_time, is_closed };
    if (scope === "day_of_week") payload.day_of_week = day_of_week;
    if (scope === "exact_date") payload.exact_date = exact_date;

    // Find existing row for upsert
    let existingQuery = supabaseService
      .from("operating_hours")
      .select("*")
      .eq("scope", scope);

    if (scope === "day_of_week") {
      existingQuery = existingQuery.eq("day_of_week", day_of_week!);
    } else if (scope === "exact_date") {
      existingQuery = existingQuery.eq("exact_date", exact_date!);
    }

    const { data: existingRow } = await existingQuery.maybeSingle();

    let result;
    if (existingRow) {
      const { data, error } = await supabaseService
        .from("operating_hours")
        .update({ open_time, close_time, is_closed })
        .eq("id", existingRow.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Add creator ID for new records
      const insertPayload = { ...payload, created_by_user_id: user.id };
      const { data, error } = await supabaseService
        .from("operating_hours")
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // Audit log (Table name is 'audit_logs' per migration 011)
    try {
      await supabaseService.from("audit_logs").insert({
        action: existingRow ? "update_operating_hours" : "create_operating_hours",
        entity_type: "operating_hours",
        entity_id: result.id,
        actor_user_id: user.id,
        actor_email: user.email || 'admin@warriors-arena.com',
        before_state: existingRow || null,
        after_state: result,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ADMIN_HOURS_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_hours");
