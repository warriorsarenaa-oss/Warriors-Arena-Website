import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async (request: Request) => {
  try {
    const { data, error } = await supabaseService
      .from('gallery_images')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_GALLERY_GET]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    
    // Check if it's an array for reordering
    if (Array.isArray(body)) {
      const { error } = await supabaseService
        .from('gallery_images')
        .upsert(body);
        
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Otherwise it's a new image
    const { url, alt_en, alt_ar, is_active = true } = body;
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const { data, error } = await supabaseService
      .from('gallery_images')
      .insert({
        url,
        alt_en,
        alt_ar,
        is_active,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[ADMIN_GALLERY_POST]", error);
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
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_GALLERY_DELETE]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");
