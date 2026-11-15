import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the PKCE Auth code exchange when a user verifies their email
 * or signs in via an email confirmation link.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Validate redirect destination to prevent open redirect vulnerabilities
      const destination =
        next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
          ? next
          : "/";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Redirect to login page with clear error message if link is invalid or expired
  return NextResponse.redirect(
    `${origin}/login?error=Verification+link+is+invalid+or+has+expired`
  );
}
