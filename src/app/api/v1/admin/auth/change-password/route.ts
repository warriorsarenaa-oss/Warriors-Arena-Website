import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseService } from "@/lib/db/supabase-service";
import { requirePermission } from "@/lib/auth/permission-middleware";

export const POST = async (request: Request) => {
  // We don't use requirePermission here because the user is changing their password,
  // they might not have roles fully evaluated or we want to allow this specifically
  // for any authenticated user. We'll manually check the session.
  const { user, error } = await getSession();
  
  if (error || !user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Safety check: ensure user is updating their own record
    if (body.userId !== user.id) {
        return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { error: updateError } = await supabaseService
      .from("users")
      .update({ must_change_password: false })
      .eq("id", user.id);

    if (updateError) {
        console.error("Failed to update must_change_password flag:", updateError);
        throw updateError;
    }

    // Log the audit event
    await supabaseService.from('audit_logs').insert({
        action: 'change_password',
        entity_type: 'users',
        entity_id: user.id,
        actor_user_id: user.id,
        before_state: { must_change_password: true },
        after_state: { must_change_password: false },
        ip_address: request.headers.get("x-forwarded-for") || 'unknown',
        user_agent: request.headers.get("user-agent") || 'unknown'
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: "An unexpected error occurred." }), { status: 500 });
  }
};
