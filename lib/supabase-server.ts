import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Create a server component client (for use in Server Components)
export async function createServerSupabaseClient() {
  return createServerComponentClient({ cookies: () => cookies() })
}

// Create a server action client (for use in Server Actions)
export async function createActionSupabaseClient() {
  return createServerActionClient({ cookies: () => cookies() })
}
