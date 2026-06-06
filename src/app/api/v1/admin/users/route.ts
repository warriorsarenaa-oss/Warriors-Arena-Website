import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import crypto from "crypto";

export const GET = requirePermission(async (_request: Request) => {
  try {
    const { searchParams } = new URL(_request.url);
    const roleFilter = searchParams.getAll("role");

    let query = supabaseService.from("users").select(`
      id, 
      username, 
      email, 
      notification_email,
      full_name,
      is_active, 
      commission_rate,
      hourly_rate,
      plain_password,
      created_at,
      roles!role_id (
        id,
        name,
        role_permissions (
          permissions (
            key
          )
        )
      )
    `);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Filter by role in memory if needed (safer than complex join filters)
    let filteredData = data ?? [];
    if (roleFilter.length > 0) {
      filteredData = filteredData.filter((user: any) => {
        const name = user.roles?.name || "";
        // Match specific roles OR custom roles if it's a staff/manager request
        if (roleFilter.includes("staff") || roleFilter.includes("manager")) {
          // Include explicitly named roles OR custom user roles (which are usually staff)
          return roleFilter.includes(name) || name.startsWith("custom_") || name === "super_admin";
        }
        return roleFilter.includes(name);
      });
    }

    const results = filteredData.map((user: any) => {
      const permissionKeys = (user.roles as any)?.role_permissions?.map(
        (rp: any) => rp.permissions?.key
      ).filter(Boolean) || [];

      return {
        ...user,
        role_name: user.roles?.name,
        permissions: permissionKeys,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[ADMIN_USERS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_users");

const CreateUserSchema = z.object({
  username: z.string().min(3).regex(/^[a-z0-9_]+$/),
  password: z.string().min(6),
  notification_email: z.string().email().optional().or(z.literal("")),
  commission_rate: z.number().min(0).default(0),
  hourly_rate: z.number().min(0).default(0),
  permissions: z.array(z.string()).default([]),
});

export const POST = requirePermission(async (request: Request, { user }) => {
  try {
    const body = await request.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const { username, password, notification_email, commission_rate, hourly_rate, permissions } = parsed.data;

    // Internal email for Supabase Auth
    const email = `${username}@warriors-arena.internal`;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData.user.id;

    try {
      // 2. Create a unique role for this user to hold their granular permissions
      const roleName = `custom_${username}_${Date.now()}`;
      const { data: roleData, error: roleError } = await supabaseService
        .from("roles")
        .insert({
          name: roleName,
          description: `Custom permissions for user ${username}`,
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // 3. Assign permissions to the new role
      if (permissions.length > 0) {
        // Fetch permission IDs for the keys
        const { data: permRecords, error: permsFetchError } = await supabaseService
          .from("permissions")
          .select("id, key")
          .in("key", permissions);

        if (permsFetchError) throw permsFetchError;

        if (permRecords && permRecords.length > 0) {
          const rolePerms = permRecords.map((p) => ({
            role_id: roleData.id,
            permission_id: p.id,
          }));
          const { error: linkError } = await supabaseService.from("role_permissions").insert(rolePerms);
          if (linkError) throw linkError;
        }
      }

      // 4. Create record in public.users table
      const { data: newUser, error: userError } = await supabaseService
        .from("users")
        .insert({
          id: newUserId,
          username,
          full_name: username, // Default to username for now
          email,
          notification_email: notification_email || null,
          role_id: roleData.id,
          commission_rate,
          hourly_rate,
          is_active: true,
          must_change_password: false,
          plain_password: password, // Stored for admin visibility only
        })
        .select()
        .single();

      if (userError) throw userError;

      // Audit log
      await logAuditAction({
        request,
        actor_user_id: user.id,
        actor_email: user.email,
        action: "create_user",
        entity_type: "users",
        entity_id: newUserId,
        after_state: newUser,
      });

      return NextResponse.json({ user: newUser }, { status: 201 });
    } catch (dbError: any) {
      // Cleanup Auth user if DB steps fail
      await supabaseService.auth.admin.deleteUser(newUserId);
      throw dbError;
    }
  } catch (error) {
    console.error("[ADMIN_USERS_POST_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_users");
