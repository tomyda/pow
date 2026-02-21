import { createClient } from "@supabase/supabase-js"

// Create a server action client using the service role key.
// Safe because server actions run exclusively on the server.
// The service role key bypasses RLS, so authorization is handled in application logic.
export async function createActionSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseKey)
} 