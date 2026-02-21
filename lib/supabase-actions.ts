import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Create a server action client (for use in Server Actions)
export async function createActionSupabaseClient() {
  return createServerComponentClient({ cookies: () => cookies() })
} 