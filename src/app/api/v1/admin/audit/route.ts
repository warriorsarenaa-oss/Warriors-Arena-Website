import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

export const GET = requirePermission(async (request: Request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const actor = searchParams.get('actor');
    const action = searchParams.get('action');
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseService
      .from('audit_logs')
      .select('*, users(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actor) query = query.eq('actor_user_id', actor);
    if (action) query = query.eq('action', action);
    if (fromStr) query = query.gte('created_at', fromStr);
    if (toStr) query = query.lte('created_at', toStr + 'T23:59:59.999Z');

    // Manager restriction
    if (user.role === 'manager') {
       const thirtyDaysAgo = new Date();
       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
       query = query.gte('created_at', thirtyDaysAgo.toISOString());
    }

    const { data: logs, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ logs, count });
  } catch (error) {
    console.error("[ADMIN_AUDIT_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "view_audit");
