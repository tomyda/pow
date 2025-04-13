import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Create a server component client (for use in Server Components)
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// Create a server action client (for use in Server Actions)
export function createActionSupabaseClient() {
  return createServerActionClient({ cookies })
}
