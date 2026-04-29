import { supabaseService } from "@/lib/db/supabase-service";
import { logger } from "./log";

/**
 * AUDIT LOGGING SYSTEM
 * 
 * Tracks every state-changing action performed by administrators.
 * Used for accountability, debugging, and security forensics.
 * 
 * Per R-SEC-09: We must record the actor, the action, and the state delta.
 */

export interface AuditEntry {
  actorUserId: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  ip?: string;
  userAgent?: string;
}

/**
 * Writes an entry to the audit_logs table.
 * 
 * Note: This should ideally be called within the same transaction 
 * as the data change, but when using Supabase-js, we often call it 
 * immediately after a successful mutation.
 */
export async function writeAudit(entry: AuditEntry) {
  try {
    const { error } = await supabaseService.from("audit_logs").insert({
      actor_user_id: entry.actorUserId,
      actor_email: entry.actorEmail,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      before_state: entry.before,
      after_state: entry.after,
      ip_address: entry.ip,
      user_agent: entry.userAgent,
    });

    if (error) {
      // Per Sprint 1 Review Checklist: Audit log writer does NOT swallow errors silently
      logger.error("Failed to write audit log to database", error, { entry });
      // We throw here? Migration instructions say "failures surface".
      // Throwing prevents the original action from being considered successful if this fails.
      throw new Error(`Audit log failure: ${error.message}`);
    }
  } catch (err) {
    logger.error("Audit log exception", err, { entry });
    throw err;
  }
}
