import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";

const UpdateUserSchema = z.object({
  commission_percentage: z.number().min(0).max(100).optional(),
  fixed_monthly_salary: z.number().min(0).optional(),
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

    const { permissions, ...userUpdates } = parsed.data;
    const { user } = context;

    const { data: existingUser, error: fetchError } = await supabaseService
      .from('users')
      .select('*, roles!role_id(id)')
      .eq('id', id)
      .single();

    if (fetchError) return NextResponse.json({ error: "User Not found" }, { status: 404 });

    if (user.id === id && userUpdates.commission_percentage !== undefined && userUpdates.commission_percentage !== Number(existingUser.commission_percentage)) {
       return NextResponse.json({ error: "Cannot change your own commission" }, { status: 400 });
    }

    // 1. Handle Permission Updates if provided
    if (permissions) {
      const roleId = (existingUser.roles as any)?.id;
      if (roleId) {
        // Clear old permissions
        await supabaseService.from('role_permissions').delete().eq('role_id', roleId);
        
        // Add new permissions
        const { data: permRecords } = await supabaseService
          .from('permissions')
          .select('id, key')
          .in('key', permissions);
        
        if (permRecords && permRecords.length > 0) {
          const newRolePerms = permRecords.map(p => ({
            role_id: roleId,
            permission_id: p.id
          }));
          await supabaseService.from('role_permissions').insert(newRolePerms);
        }
      }
    }

    // 2. Handle User Field Updates
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
  } catch (error: any) {
    console.error("[ADMIN_USERS_PATCH_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}, "manage_users");
