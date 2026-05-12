/**
 * SERVER-ONLY SUPABASE CLIENT
 * 
 * This client uses the service-role key which bypasses RLS.
 * NEVER import this file into a Client Component or any code that runs in the browser.
 */
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Runtime check to prevent accidental browser inclusion
if (typeof window !== "undefined") {
  throw new Error("CRITICAL: supabase-service client imported in browser context.");
}

export function createSupabaseService() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'Cache-Control': 'no-store',
        }
      }
    }
  );
}

export const supabaseService = createSupabaseService();
