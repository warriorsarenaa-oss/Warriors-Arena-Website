import { NextResponse } from "next/server";
import { getSession } from "./session";
import { getUserPermissions, UserPermissions } from "./permissions";
import * as Sentry from "@sentry/nextjs";

/**
 * PERMISSION MIDDLEWARE (HOF)
 * 
 * A Higher-Order Function that wraps API route handlers to enforce RBAC.
 * 
 * Usage:
 * export const POST = requirePermission(async (req, { user, permissions }) => {
 *   // ... logic
 * }, "manage_bookings");
 */

export interface AuthenticatedContext {
  user: any; // Supabase user object
  permissions: UserPermissions;
}

type BoundHandler = (
  request: Request,
  context: AuthenticatedContext & { params: any }
) => Promise<NextResponse> | NextResponse;

export function requirePermission(handler: BoundHandler, permissionKey?: string) {
  return async (request: Request, { params }: { params: any }) => {
    // 1. Verify Session
    const { user, error } = await getSession();
    
    if (error || !user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", message: "Authenticaton required" }), 
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch Permissions
    const permissions = await getUserPermissions(user.id);

    // 3. Verify Active Status
    if (!permissions.isActive) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden", message: "User account is inactive" }), 
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Verify Specific Permission (if provided)
    if (permissionKey && !permissions.permissionKeys.includes(permissionKey)) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden", message: `Missing required permission: ${permissionKey}` }), 
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Resolve params (Required for Next.js 15+)
    const resolvedParams = await params;

    // 7. Execute Handler with Auth Context
    return handler(request, { user: { ...user, role: permissions.role }, permissions, params: resolvedParams });
  };
}
