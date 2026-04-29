import { supabaseService } from "@/lib/db/supabase-service";

export interface AuditLogOptions {
  actor_user_id: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: any;
  after_state?: any;
  request?: Request;
}

/**
 * Standard utility to log administrative actions.
 * Table: audit_logs (plural)
 */
export async function logAuditAction(options: AuditLogOptions) {
  try {
    const { 
      actor_user_id, 
      actor_email, 
      action, 
      entity_type, 
      entity_id, 
      before_state, 
      after_state, 
      request 
    } = options;

    let ip_address = "unknown";
    let user_agent = "unknown";

    if (request) {
      ip_address = request.headers.get("x-forwarded-for") || "unknown";
      user_agent = request.headers.get("user-agent") || "unknown";
    }

    const { error } = await supabaseService
      .from("audit_logs")
      .insert({
        actor_user_id,
        actor_email,
        action,
        entity_type,
        entity_id: String(entity_id),
        before_state,
        after_state,
        ip_address,
        user_agent
      });

    if (error) {
      console.error("[AUDIT_LOG_ERROR]", error);
    }
  } catch (err) {
    console.error("[AUDIT_LOG_CRITICAL_FAILURE]", err);
  }
}
