import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with the SERVICE_ROLE key.
 * 
 * WARNING: This client bypasses RLS. NEVER import this in client components.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 * 
 * Only use in:
 * - Server Actions
 * - API Route Handlers
 * - Server-side only utilities
 * 
 * Always verify the caller is an admin before using this client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
