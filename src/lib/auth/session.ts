import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * AUTH SESSION HELPER
 * 
 * Fetches the current user and session from Supabase using cookies.
 * This is used to verify authentication status in server-side routes and components.
 */
export async function getSession() {
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
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error };
  }

  return { user, error: null };
}
