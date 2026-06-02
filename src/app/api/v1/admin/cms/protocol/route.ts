import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async (request: Request) => {
  try {
    const { data, error } = await supabaseService
      .from('protocol_steps')
      .select('*')
      .order('step_number', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_PROTOCOL_GET]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");

export const POST = requirePermission(async (request: Request) => {
  try {
    const body = await request.json();
    
    // Check if it's an array for reordering updates
    if (Array.isArray(body)) {
      const { error } = await supabaseService
        .from('protocol_steps')
        .upsert(body);
        
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseService
      .from('protocol_steps')
      .insert(body);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_PROTOCOL_POST]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");

export const PUT = requirePermission(async (request: Request) => {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabaseService
      .from('protocol_steps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_PROTOCOL_PUT]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");

export const DELETE = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabaseService
      .from('protocol_steps')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_PROTOCOL_DELETE]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");
