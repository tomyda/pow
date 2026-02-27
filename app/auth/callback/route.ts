import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  try {
    const code = requestUrl.searchParams.get("code")
    const error = requestUrl.searchParams.get("error")
    const errorDescription = requestUrl.searchParams.get("error_description")

    if (error) {
      console.error("OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorDescription || "Authentication failed")}`, requestUrl.origin),
      )
    }

    if (code) {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            },
          },
        }
      )

      await supabase.auth.exchangeCodeForSession(code)

      const { data, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error getting user after auth:", userError)
        return NextResponse.redirect(
          new URL(`/?error=${encodeURIComponent("Failed to get user after authentication")}`, requestUrl.origin),
        )
      }

      if (data.user) {
        const email = data.user.email
        if (!email || !email.endsWith("@usehorizon.ai")) {
          await supabase.auth.signOut()
          return NextResponse.redirect(new URL("/unauthorized", requestUrl.origin))
        }

        const { data: existingUser, error: existingUserError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (existingUserError && existingUserError.code !== 'PGRST116') {
          console.error("Error checking existing user:", existingUserError)
          return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent("Failed to check user record")}`, requestUrl.origin),
          )
        }

        if (!existingUser) {
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || email.split('@')[0],
              avatar_url: data.user.user_metadata?.avatar_url,
              is_admin: false
            })

          if (createError) {
            console.error("Error creating user record:", createError)
            return NextResponse.redirect(
              new URL(`/?error=${encodeURIComponent("Failed to create user record")}`, requestUrl.origin),
            )
          }
        }
      }
    }

    return NextResponse.redirect(new URL("/", requestUrl.origin))
  } catch (error) {
    console.error("Error in auth callback:", error)
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent("Authentication failed")}`, requestUrl.origin))
  }
}
