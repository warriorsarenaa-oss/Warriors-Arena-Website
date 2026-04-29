"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

interface TopbarProps {
  user: { email?: string; name: string };
  role: string;
}

export function AdminTopbar({ user, role }: TopbarProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-wa-bg/80 backdrop-blur-md border-b border-wa-green/20 flex items-center justify-end px-6 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-wa-green/20 flex items-center justify-center border border-wa-green/50">
            <User className="w-4 h-4 text-wa-green" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-wider">{user.name}</span>
            <span className="text-[10px] text-wa-green uppercase tracking-widest bg-wa-green/10 px-1 py-0.5 rounded w-max mt-0.5">
              {role.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-wa-green/20"></div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-wa-text/70 hover:text-wa-error transition-colors uppercase tracking-widest text-xs font-bold group"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          DISCONNECT
        </button>
      </div>
    </header>
  );
}
