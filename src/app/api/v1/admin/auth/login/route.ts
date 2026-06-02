import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseService } from "@/lib/db/supabase-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/log";

/**
 * ADMIN LOGIN ENDPOINT
 *
 * Replaces the client-side Supabase auth call with a server-side route
 * that enforces rate limiting (5 attempts per 15 minutes per IP).
 *
 * Security model:
 * - IP-based rate limiting via checkRateLimit()
 * - Returns generic errors — never leaks whether an account exists
 * - Logs all failed attempts with IP for audit purposes
 */

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 1. Rate-limit by IP
  const rateLimitKey = `admin_login:${ip}`;
  const { allowed, retryAfterSeconds } = await checkRateLimit(
    rateLimitKey,
    MAX_ATTEMPTS,
    WINDOW_SECONDS
  );

  if (!allowed) {
    logger.warn("Admin login rate-limited", { ip, rateLimitKey });
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(MAX_ATTEMPTS),
        },
      }
    );
  }

  // 2. Parse body
  let email: string;
  let password: string;
  try {
    const body = await request.json();
    email = body.email;
    password = body.password;
    if (!email || !password) throw new Error("Missing fields");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // 3. Attempt Supabase sign-in
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    // Generic error — never reveal if email exists
    logger.warn("Failed admin login attempt", { ip, email: email.substring(0, 3) + "***" });
    return NextResponse.json(
      { error: "Invalid credentials. Please check your username and password." },
      { status: 401 }
    );
  }

  // 4. Fetch profile to check must_change_password
  const { data: profile } = await supabaseService
    .from("users")
    .select("must_change_password, is_active, full_name")
    .eq("id", authData.user.id)
    .single();

  if (!profile?.is_active) {
    // Sign out the user immediately
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
  }

  logger.info("Successful admin login", { userId: authData.user.id, ip });

  return NextResponse.json({
    success: true,
    mustChangePassword: profile?.must_change_password ?? false,
    user: {
      id: authData.user.id,
      email: authData.user.email,
      name: profile?.full_name,
    },
  });
}
