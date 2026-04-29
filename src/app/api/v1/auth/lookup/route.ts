import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/db/supabase-service";

/**
 * PUBLIC AUTH LOOKUP
 * 
 * Allows the login page to resolve a username to an email
 * because Supabase Auth requires an email for login.
 * This is limited to returning ONLY the email for a valid username.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseService
      .from("users")
      .select("email")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ email: null });
    }

    return NextResponse.json({ email: data.email });
  } catch (err) {
    console.error("[AUTH_LOOKUP_ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
