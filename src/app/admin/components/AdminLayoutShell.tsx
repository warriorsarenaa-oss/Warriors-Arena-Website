"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { UserPermissions } from "@/lib/auth/permissions";

export function AdminLayoutShell({
  user,
  permissions,
  children,
}: {
  user: { email: string; name: string };
  permissions: UserPermissions;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-wa-bg text-wa-text font-mono overflow-hidden relative">
      <Toaster richColors closeButton theme="dark" position="top-right" />
      {/* Mobile Menu Button - Top Left */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-3 left-4 z-[60] p-2 bg-wa-bg border border-wa-green/50 text-wa-green rounded shadow-[0_0_15px_rgba(143,224,74,0.2)] transition-all hover:bg-wa-green/10 active:scale-95"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.8)]" : "-translate-x-full"}
        `}
      >
        <AdminSidebar permissions={permissions} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 w-full">
        <AdminTopbar user={user} role={permissions.role || "unknown"} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          {/* Global noise overlay for admin */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay">
              <svg width="100%" height="100%">
                  <filter id="noise">
                      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
                  </filter>
                  <rect width="100%" height="100%" filter="url(#noise)" />
              </svg>
          </div>

          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
