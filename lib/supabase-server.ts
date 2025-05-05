import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Create a server component client (for use in Server Components)
export async function createServerSupabaseClient() {
  return createServerComponentClient({ cookies: () => cookies() })
}
