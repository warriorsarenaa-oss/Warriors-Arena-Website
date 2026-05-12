import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    
    let query = supabaseService.from('cms_content').select('*');
    if (section) {
      query = query.eq('section', section);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Group by section
    const grouped = data.reduce((acc: any, item: any) => {
      if (!acc[item.section]) acc[item.section] = {};
      acc[item.section][item.key] = {
        value_en: item.value_en,
        value_ar: item.value_ar,
        content_type: item.content_type
      };
      return acc;
    }, {});
    
    return NextResponse.json(grouped);
  } catch (error) {
    console.error("[CMS_GET]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be an array of updates" }, { status: 400 });
    }

    const { error } = await supabaseService
      .from('cms_content')
      .upsert(body, { onConflict: 'section,key' });

    if (error) throw error;

    // Optional: Log to audit_logs
    try {
      await supabaseService.from('audit_logs').insert({
        action: 'update_cms',
        entity_type: 'cms_content',
        entity_id: body[0]?.section || 'unknown',
        actor_user_id: user.id,
        actor_email: user.email || 'admin@warriors-arena.com',
        after_state: { updates: body.length },
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      });
    } catch (auditErr) {
      console.warn("Audit logging failed (non-critical):", auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CMS_POST]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_content");
