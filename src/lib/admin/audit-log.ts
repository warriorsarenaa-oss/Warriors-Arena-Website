import { supabaseService } from "@/lib/db/supabase-service";
import { logger } from "@/lib/log";

export interface AuditLogOptions {
  actor_user_id: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  /** Pass the incoming Request to auto-extract IP and User-Agent. */
  request?: Request;
  /** Override IP directly (useful when no Request is available). */
  ip_address?: string;
  /** Override User-Agent directly (useful when no Request is available). */
  user_agent?: string;
}

/**
 * Standard utility to log administrative actions.
 * Table: audit_logs (plural)
 *
 * Failures are logged but never swallowed silently — callers should
 * handle the thrown error if audit integrity is critical for the operation.
 */
export async function logAuditAction(options: AuditLogOptions): Promise<void> {
  const {
    actor_user_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state,
    request,
  } = options;

  const ip_address =
    options.ip_address ??
    request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const user_agent =
    options.user_agent ?? request?.headers.get("user-agent") ?? "unknown";

  try {
    const { error } = await supabaseService.from("audit_logs").insert({
      actor_user_id,
      actor_email,
      action,
      entity_type,
      entity_id: String(entity_id),
      before_state,
      after_state,
      ip_address,
      user_agent,
    });

    if (error) {
      logger.warn("Failed to write audit log", { action, entity_type, entity_id, error });
    }
  } catch (err) {
    logger.warn("Audit log exception", { action, entity_type, entity_id, err });
  }
}
