"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserPermissions } from "@/lib/auth/permissions";
import {
  LayoutDashboard,
  CalendarDays,
  LineChart,
  Wallet,
  Users,
  ShieldAlert,
  Clock,
  DollarSign,
  Gamepad2,
  Package,
  Download,
  FileText,
  Target,
} from "lucide-react";

interface SidebarProps {
  permissions: UserPermissions;
  onNavigate?: () => void;
}

export function AdminSidebar({ permissions, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const keys = permissions.permissionKeys;

  const navItems = [
    { name: "Dashboard",    href: "/admin",             icon: LayoutDashboard, required: "view_dashboard" },
    { name: "Reservations", href: "/admin/reservations", icon: CalendarDays,    required: "view_bookings" },
    { name: "Schedules",    href: "/admin/schedules/weekly-planner", icon: Clock, required: "manage_users" },
    { name: "Revenue",      href: "/admin/revenue",      icon: LineChart,       required: "view_revenue" },
    { name: "Financials",   href: "/admin/financials",   icon: Wallet,          required: "view_financials" },
    { name: "Payroll",      href: "/admin/financials/payroll", icon: DollarSign, required: "manage_financials" },
    { name: "Content",      href: "/admin/content",      icon: FileText,        required: "manage_content" },
    { name: "Hours",        href: "/admin/hours",        icon: Clock,           required: "manage_hours" },
    { name: "Pricing",      href: "/admin/pricing",      icon: DollarSign,      required: "manage_pricing" },
    { name: "Games",        href: "/admin/games",        icon: Gamepad2,        required: "manage_games" },
    { name: "Missions",     href: "/admin/missions",     icon: Target,          required: "manage_content" },
    { name: "Export",       href: "/admin/export",       icon: Download,        required: "export_data" },
    { name: "Users",        href: "/admin/users",        icon: Users,           required: "manage_users" },
    { name: "Audit Log",    href: "/admin/audit",        icon: ShieldAlert,     required: "view_audit" },
  ];

  return (
    <aside className="w-64 bg-wa-bg border-r border-wa-green/20 h-full flex flex-col z-20 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-wa-green/20">
        <span className="text-xl font-bold font-heading uppercase tracking-widest">
          <span className="text-wa-text">WA</span> <span className="text-wa-green">ADMIN</span>
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          // Check permission
          if (item.required && !keys.includes(item.required)) {
            return null;
          }

          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-wa-green/10 text-wa-green shadow-[inset_0_0_10px_rgba(57,255,20,0.05)]"
                  : "text-wa-text/70 hover:bg-wa-text/5 hover:text-wa-text"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-wa-green" : "group-hover:text-wa-green transition-colors"}`} />
              <span className="text-sm font-medium tracking-wide uppercase">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
