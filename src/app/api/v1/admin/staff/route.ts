import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";

export const GET = requirePermission(async () => {
  try {
    const { data, error } = await supabaseService
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('username');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_STAFF_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_users");

export const PATCH = requirePermission(async (request: Request) => {
  try {
    const body = await request.json();
    const { id, hourly_rate, commission_per_game } = body;

    const { data, error } = await supabaseService
      .from('users')
      .update({ hourly_rate, commission_per_game })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_STAFF_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_users");
