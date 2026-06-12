import { supabaseService } from "@/lib/db/supabase-service";

/**
 * RBAC PERMISSIONS SYSTEM
 * 
 * Fetches user roles and associated permission keys directly from the database.
 * Per R-SEC-05, we do not cache permissions in the JWT to ensure that 
 * authorization changes (revocations) take effect immediately.
 */

export interface UserPermissions {
  role: string | null;
  permissionKeys: string[];
  isActive: boolean;
}

interface RoleWithPermissions {
  roles: {
    role_permissions: Array<{
      permissions: {
        key: string;
      };
    }>;
  };
}

interface UserWithRole {
  is_active: boolean;
  user_roles: Array<{
    roles: {
      name: string;
    };
  }>;
}

/**
 * Retrieves the effective permissions for a given user ID.
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  // 1. Fetch user status and role directly via role_id FK
  const { data: userData, error: userError } = await supabaseService
    .from("users")
    .select(`
      is_active,
      roles (
        id,
        name,
        role_permissions (
          permissions (
            key
          )
        )
      )
    `)
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    console.error("[PERMISSIONS_ERROR]", userError);
    return { role: null, permissionKeys: [], isActive: false };
  }

  const rawRoleData = userData.roles as any;
  const role = Array.isArray(rawRoleData) ? rawRoleData[0] : rawRoleData;
  const roleName = role?.name || null;
  const isActive = userData.is_active === true;

  if (!isActive || !roleName) {
    return { role: roleName, permissionKeys: [], isActive };
  }

  // Flatten the nested structure
  const rawPermissions = role?.role_permissions || [];
  const permissionKeys = rawPermissions
    .map((rp: any) => rp.permissions?.key)
    .filter(Boolean) as string[];

  return {
    role: roleName,
    permissionKeys,
    isActive
  };
}

/**
 * Checks if a user has a specific permission key.
 */
export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const { permissionKeys, isActive } = await getUserPermissions(userId);
  return isActive && permissionKeys.includes(permissionKey);
}
