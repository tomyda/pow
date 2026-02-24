import { getSupabase } from '@/lib/supabase'

/**
 * Checks if an email belongs to the Horizon domain
 */
export function isHorizonEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.endsWith("@usehorizon.ai")
}

/**
 * Ensures the user is authenticated and has a Horizon email
 */
export function ensureHorizonUser(user: any): boolean {
  if (!user) return false
  return isHorizonEmail(user.email)
}

/**
 * Retrieves the current authenticated user with their profile data
 */
export async function getCurrentUser() {
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) return null
  
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()
    
  return data
}