import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Validates a redirect path to prevent open redirect vulnerabilities.
 * Ensures destinations are relative internal paths only.
 */
function getSafeRedirectUrl(target) {
  if (!target || typeof target !== "string") return "/";
  const trimmed = target.trim();
  // Must start with a single slash, not double slashes (protocol-relative URLs)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed;
  }
  return "/";
}

/**
 * Refreshes auth sessions and enforces route protection rules.
 * Invoked by root Next.js middleware on matching requests.
 */
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: ALWAYS use getUser() instead of getSession() for server-side verification.
  // getUser() sends a request to the Supabase Auth server to validate the JWT.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;

  // 1. Protected routes that require authentication
  const protectedPrefixes = ["/library", "/account", "/onboarding", "/admin"];
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Auth routes: logged-in users cannot re-visit /login or /register
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  if (user && isAuthRoute) {
    const rawRedirect = searchParams.get("redirectTo");
    const safeDestination = getSafeRedirectUrl(rawRedirect);
    const redirectUrl = new URL(safeDestination, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
