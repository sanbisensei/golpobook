import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles server-side user logout, clears session cookies,
 * and redirects to the login screen.
 */
export async function POST(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`, {
    status: 303,
  });
}
