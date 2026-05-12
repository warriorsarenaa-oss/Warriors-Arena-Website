/**
 * @deprecated Use `@/lib/admin/audit-log` instead.
 *
 * This file is a compatibility shim. The canonical audit utility is
 * `src/lib/admin/audit-log.ts` which uses the correct table name ("audit_logs")
 * and a unified interface.
 *
 * All callers have been migrated. This file will be removed in a future cleanup.
 */
export { logAuditAction as writeAudit } from "@/lib/admin/audit-log";
export type { AuditLogOptions as AuditEntry } from "@/lib/admin/audit-log";
