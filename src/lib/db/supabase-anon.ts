import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Supabase anon client for public reads.
 * Safe to use in both Client and Server components.
 */
export const supabaseAnon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
