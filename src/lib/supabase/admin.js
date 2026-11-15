import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a privileged Supabase administrative client using the Service Role Key.
 * NEVER import or execute this file in client-side components!
 * Strictly reserved for backend webhooks (e.g. SSLCommerz IPN) and background maintenance jobs.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "FATAL SECURITY VIOLATION: createAdminClient() cannot be invoked in browser client components."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
