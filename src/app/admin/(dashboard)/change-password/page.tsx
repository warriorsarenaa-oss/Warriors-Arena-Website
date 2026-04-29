"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { WAButton } from "@/components/UI/WAButton";
import { WAPanel } from "@/components/UI/WAPanel";
import commonPassword from "common-password";

// Define the password validation regexes
const HAS_LOWER = /[a-z]/;
const HAS_UPPER = /[A-Z]/;
const HAS_DIGIT = /\d/;
const HAS_SYMBOL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Validate the user's session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
      }
    };
    checkSession();
  }, [router, supabase]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) return "Password must be at least 12 characters long.";
    if (!HAS_LOWER.test(pwd)) return "Password must contain a lowercase letter.";
    if (!HAS_UPPER.test(pwd)) return "Password must contain an uppercase letter.";
    if (!HAS_DIGIT.test(pwd)) return "Password must contain a digit.";
    if (!HAS_SYMBOL.test(pwd)) return "Password must contain a symbol (!@#$%^&*).";
    
    if (commonPassword(pwd.toLowerCase())) {
      return "Password is too common. Please choose a stronger password.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(`Password too weak: ${validationError}`);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found.");

      // First, re-authenticate to verify current password (Supabase best practice)
      // Since they are already logged in, we might just update, but verifying current is requested.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Incorrect current password.");
      }

      // Update auth password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Update users table must_change_password flag
      // Call our API endpoint to bypass RLS or use standard update if allowed by RLS
      const res = await fetch("/api/v1/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });

      if (!res.ok) {
         console.warn("Failed to update must_change_password flag via API. RLS might be blocking direct updates.");
         // We will implement this API next.
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-wa-bg flex items-center justify-center p-4 font-mono text-wa-text">
        <WAPanel className="w-full max-w-md p-8 border border-wa-green bg-wa-bg/50 text-center">
          <h2 className="text-2xl font-bold text-wa-green mb-4">SECURITY PROTOCOL UPDATED</h2>
          <p className="opacity-80">Password successfully changed. Redirecting to command center...</p>
        </WAPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wa-bg flex items-center justify-center p-4 font-mono text-wa-text">
      <WAPanel className="w-full max-w-md p-8 border border-wa-orange/50 bg-wa-bg/50 backdrop-blur-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-wa-orange mb-2 uppercase tracking-widest font-heading">
            MANDATORY PROTOCOL
          </h1>
          <p className="text-wa-text/60 text-xs">UPDATE SECURITY CREDENTIALS TO PROCEED</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="bg-wa-error/10 border border-wa-error text-wa-error p-3 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest opacity-70">
              Current Access Code
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-transparent border-b-2 border-wa-text/20 p-2 focus:border-wa-orange outline-none transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest opacity-70">
              New Access Code
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-transparent border-b-2 border-wa-text/20 p-2 focus:border-wa-orange outline-none transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest opacity-70">
              Verify New Access Code
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-transparent border-b-2 border-wa-text/20 p-2 focus:border-wa-orange outline-none transition-colors"
              required
            />
          </div>

          <WAButton
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-wa-orange text-wa-bg font-bold hover:bg-wa-orange/90 uppercase tracking-widest"
          >
            {loading ? "Processing..." : "Update Credentials"}
          </WAButton>
        </form>
      </WAPanel>
    </div>
  );
}
