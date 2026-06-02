"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WAButton } from "@/components/UI/WAButton";
import { WAPanel } from "@/components/UI/WAPanel";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Resolve username → email server-side if no "@" present
    let loginEmail = username;

    if (!username.includes("@")) {
      try {
        const res = await fetch(`/api/v1/auth/lookup?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const { email } = await res.json();
          loginEmail = email || `${username}@warriorsarena.example`;
        } else {
          loginEmail = `${username}@warriorsarena.example`;
        }
      } catch {
        loginEmail = `${username}@warriorsarena.example`;
      }
    }

    try {
      // All auth goes through the server-side route — rate limiting enforced there
      const res = await fetch("/api/v1/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setError("Too many login attempts. Please try again later.");
        return;
      }

      if (res.status === 403) {
        setError("Your account has been deactivated. Contact an administrator.");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please check your username and password.");
        return;
      }

      // Server returns mustChangePassword flag — no extra round-trip needed
      if (data.mustChangePassword) {
        router.push("/admin/change-password");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wa-bg flex items-center justify-center p-4 font-mono text-wa-text overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 wa-anim-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 wa-scanline pointer-events-none" />
      
      <WAPanel className="w-full max-w-md p-8 border border-wa-green/20 bg-wa-bg/80 backdrop-blur-xl relative z-10 wa-brackets">
        <div className="text-center mb-8">
          <div className="wa-tape mb-4">Classified Access</div>
          <h1 className="text-4xl font-bold text-wa-green mb-2 uppercase tracking-[0.2em] font-heading">
            WA CMD CENTER
          </h1>
          <p className="text-wa-text/40 text-[10px] tracking-[0.3em] uppercase">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-8">
          {error && (
            <div className="bg-wa-red/10 border border-wa-red/30 text-wa-red p-3 text-xs uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="wa-label">
              Operator ID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="wa-input"
              placeholder="e.g. warriors_admin"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="wa-label">
              Access Code
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="wa-input pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-wa-green/50 hover:text-wa-green transition-colors z-10"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <WAButton
            type="submit"
            disabled={loading}
            className="w-full mt-2 font-bold uppercase tracking-[0.2em]"
          >
            {loading ? "INITIALIZING..." : "INITIALIZE SESSION"}
          </WAButton>
          
          <div className="mt-4 flex justify-between items-center opacity-30 text-[9px] uppercase tracking-widest">
            <span>Security: Level 4</span>
            <span>IP: Logged</span>
          </div>
        </form>
      </WAPanel>

      {/* Global noise overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay">
          <svg width="100%" height="100%">
              <filter id="noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
      </div>
    </div>
  );
}
