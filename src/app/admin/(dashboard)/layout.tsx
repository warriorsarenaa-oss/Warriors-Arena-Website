import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getUserPermissions } from "@/lib/auth/permissions";
import { AdminLayoutShell } from "../components/AdminLayoutShell";
import { supabaseService } from "@/lib/db/supabase-service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, error } = await getSession();

  if (error || !user) {
    redirect("/admin/login");
  }

  // Fetch permissions for the logged-in user
  const permissions = await getUserPermissions(user.id);

  // If inactive, maybe redirect or show error.
  if (!permissions.isActive) {
    // Basic unauthorized page for inactive users
    return (
      <div className="flex h-screen items-center justify-center bg-wa-bg text-wa-error font-mono">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">ACCESS DENIED</h1>
          <p>Your account has been deactivated. Contact an administrator.</p>
        </div>
      </div>
    );
  }

  // Double-check must_change_password via direct query because session might not have it
  const { data: profile } = await supabaseService
      .from('users')
      .select('must_change_password, full_name')
      .eq('id', user.id)
      .single();
      
  // ENFORCE PASSWORD CHANGE
  if (profile?.must_change_password) {
      redirect("/admin/change-password");
  }

  return (
    <AdminLayoutShell 
      user={{ email: user.email!, name: profile?.full_name || 'Agent' }} 
      permissions={permissions}
    >
      {children}
    </AdminLayoutShell>
  );
}
