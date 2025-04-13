import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of routes that require authentication
const protectedRoutes = ['/vote', '/profile', '/admin']

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next()

  // Add security headers to allow Google authentication
  res.headers.set("Access-Control-Allow-Origin", "*")
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.headers.set("Access-Control-Allow-Credentials", "true")

  // Add Content-Security-Policy header to allow Google authentication and other necessary resources
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "connect-src 'self' https://*.supabase.co https://api.supabase.io https://*.google.com https://accounts.google.com https://my.productfruits.com; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.productfruits.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "frame-src https://accounts.google.com; " +
    "img-src 'self' data: https://*.googleusercontent.com https://api.dicebear.com https://my.productfruits.com;"
  )

  // Only check authentication for protected routes
  if (protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    try {
      // Create a new response for the redirect if needed
      const redirectRes = NextResponse.redirect(new URL('/', req.url))

      // Create the Supabase client with the response
      const supabase = createMiddlewareClient({ req, res })

      // Get the session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // If user is not signed in and trying to access a protected route, redirect to home
      if (!session) {
        return redirectRes
      }

      // If user is signed in but doesn't have a valid email domain
      if (session.user) {
        const email = session.user.email
        if (!email || !email.endsWith("@usehorizon.ai")) {
          // Sign out the user
          await supabase.auth.signOut()

          // Redirect to unauthorized page
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
      }
    } catch (error) {
      console.error("Middleware error:", error)
      // Return the original response if there's an error
      return res
    }
  }

  return res
}

// Specify which routes should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
