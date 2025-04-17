import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  try {
    const code = requestUrl.searchParams.get("code")
    const error = requestUrl.searchParams.get("error")
    const errorDescription = requestUrl.searchParams.get("error_description")

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorDescription || "Authentication failed")}`, requestUrl.origin),
      )
    }

    if (code) {
      const supabase = createRouteHandlerClient({ cookies })

      await supabase.auth.exchangeCodeForSession(code)

      // Get the user after authentication
      const { data, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error getting user after auth:", userError)
        return NextResponse.redirect(
          new URL(`/?error=${encodeURIComponent("Failed to get user after authentication")}`, requestUrl.origin),
        )
      }

      // Check if user has valid email domain
      if (data.user) {
        const email = data.user.email
        if (!email || !email.endsWith("@usehorizon.ai")) {
          // Sign out the user
          await supabase.auth.signOut()
          // Redirect to unauthorized page
          return NextResponse.redirect(new URL("/unauthorized", requestUrl.origin))
        }

        // Check if user record exists
        const { data: existingUser, error: existingUserError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error("Error checking existing user:", existingUserError)
          return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent("Failed to check user record")}`, requestUrl.origin),
          )
        }

        // If user doesn't exist in the users table, create a record
        if (!existingUser) {
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || email.split('@')[0],
              avatar_url: data.user.user_metadata?.avatar_url,
              is_admin: false // Default to non-admin
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

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL("/", requestUrl.origin))
  } catch (error) {
    console.error("Error in auth callback:", error)
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent("Authentication failed")}`, requestUrl.origin))
  }
}
