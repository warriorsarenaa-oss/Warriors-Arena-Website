import { createClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase anon client.
 *
 * Uses only NEXT_PUBLIC_* vars — safe to import in client components.
 * Does NOT import env.ts, which would pull server-only vars into the browser bundle.
 *
 * Use this file in "use client" components.
 * Use supabase-anon.ts in server components and API routes (it validates all vars at boot).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
