import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";

const UpdateUserSchema = z.object({
  full_name: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  plain_password: z.string().optional(),
  role_id: z.string().uuid().optional(),
  commission_rate: z.number().min(0).optional(),
  hourly_rate: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

export const PATCH = requirePermission(async (request: Request, context: any) => {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const { email, password, permissions, ...userUpdates } = parsed.data;
    const { user } = context;

    const { data: existingUser, error: fetchError } = await supabaseService
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) return NextResponse.json({ error: "User Not found" }, { status: 404 });

    if (user.id === id && userUpdates.commission_rate !== undefined && userUpdates.commission_rate !== Number(existingUser.commission_rate)) {
       return NextResponse.json({ error: "Cannot change your own commission" }, { status: 400 });
    }

    // 1. Handle Permissions Updates
    if (permissions !== undefined) {
      const roleId = existingUser.role_id;
      if (roleId) {
        // Delete existing role permissions
        const { error: deleteError } = await supabaseService
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId);

        if (deleteError) throw deleteError;

        // Insert new ones
        if (permissions.length > 0) {
          const { data: permRecords, error: permsFetchError } = await supabaseService
            .from("permissions")
            .select("id, key")
            .in("key", permissions);

          if (permsFetchError) throw permsFetchError;

          if (permRecords && permRecords.length > 0) {
            const rolePerms = permRecords.map((p) => ({
              role_id: roleId,
              permission_id: p.id,
            }));
            const { error: linkError } = await supabaseService
              .from("role_permissions")
              .insert(rolePerms);
            if (linkError) throw linkError;
          }
        }
      }
    }

    // 2. Handle Auth Level Updates (Email, Password)
    if (email || password) {
      const authUpdates: any = {};
      if (email) authUpdates.email = email;
      if (password) authUpdates.password = password;
      
      const { error: authError } = await supabaseService.auth.admin.updateUserById(id, authUpdates);
      if (authError) {
        return NextResponse.json({ error: `Auth update failed: ${authError.message}` }, { status: 400 });
      }

      // Also persist plain_password in public users table for admin visibility
      if (password) {
        await supabaseService.from('users').update({ plain_password: password }).eq('id', id);
      }
    }

    // 3. Handle User Field Updates
    if (Object.keys(userUpdates).length > 0) {
      const { data: updatedUser, error: updateError } = await supabaseService
        .from('users')
        .update(userUpdates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Audit log
      await logAuditAction({
        request,
        actor_user_id: user.id,
        actor_email: user.email,
        action: 'update_user',
        entity_type: 'users',
        entity_id: id,
        before_state: existingUser,
        after_state: updatedUser
      });

      return NextResponse.json(updatedUser);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_USERS_PATCH_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}, "manage_users");
