import { createServerClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ['/vote', '/profile', '/admin', '/test', '/users']

export async function middleware(req: NextRequest) {
  try {
    let res = NextResponse.next()

    res.headers.set("Access-Control-Allow-Origin", "*")
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    res.headers.set("Access-Control-Allow-Credentials", "true")

    res.headers.set(
      "Content-Security-Policy",
      "default-src 'self' *; " +
      "connect-src 'self' * https://*.supabase.co https://api.supabase.io https://*.google.com https://accounts.google.com https://my.productfruits.com; " +
      "script-src 'self' * 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.productfruits.com; " +
      "style-src 'self' * 'unsafe-inline'; " +
      "frame-src * https://accounts.google.com; " +
      "img-src 'self' * data: https://*.googleusercontent.com https://api.dicebear.com https://my.productfruits.com https://*.licdn.com https://media.licdn.com;"
    )

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              req.cookies.set(name, value)
            )
            res = NextResponse.next({ request: req })
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

    if (isProtectedRoute && !session) {
      const authUrl = new URL('/auth', req.url)
      if (req.nextUrl.pathname !== authUrl.pathname) {
        return NextResponse.redirect(authUrl)
      }
    }

    if (session?.user) {
      const email = session.user.email
      if (!email || !email.endsWith("@usehorizon.ai")) {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/',
    '/vote/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/users/:path*',
  ],
}
