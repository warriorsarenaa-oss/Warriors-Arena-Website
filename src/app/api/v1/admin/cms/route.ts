import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const GET = requirePermission(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const supabase = createSupabaseService();
    
    let query = supabase.from('cms_content').select('*');
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
    
    const supabase = createSupabaseService();
    const { error } = await supabase
      .from('cms_content')
      .upsert(body, { onConflict: 'section,key' });

    if (error) throw error;

    // After successful save, revalidate public pages
    try {
      revalidatePath('/', 'layout'); // Revalidate all paths under [locale] layout
      revalidatePath('/[locale]', 'page');
    } catch (err) {
      console.error('Revalidation error:', err);
    }

    // Optional: Log to audit_logs
    try {
      await supabase.from('audit_logs').insert({
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
