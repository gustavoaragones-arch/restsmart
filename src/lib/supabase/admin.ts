import { createClient } from "@supabase/supabase-js";

/**
 * Service role client - bypasses RLS. Use only server-side (API routes, webhooks).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
}
