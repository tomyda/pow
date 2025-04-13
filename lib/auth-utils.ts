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
