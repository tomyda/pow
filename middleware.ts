import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Get the response
  const res = NextResponse.next()

  // Add security headers to allow Google authentication
  res.headers.set("Access-Control-Allow-Origin", "*")
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

  // Add Content-Security-Policy header to allow Google authentication
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' https://*.supabase.co https://api.supabase.io https://*.google.com https://accounts.google.com; script-src 'self' 'unsafe-inline' https://*.supabase.co; frame-src https://accounts.google.com; img-src 'self' data: https://*.googleusercontent.com https://api.dicebear.com;",
  )

  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is signed in but doesn't have a valid email domain
  if (session?.user) {
    const email = session.user.email
    if (!email || !email.endsWith("@usehorizon.ai")) {
      // Sign out the user
      await supabase.auth.signOut()

      // Redirect to unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  return res
}

// Only apply middleware to the auth routes
export const config = {
  matcher: ["/auth/:path*"],
}
