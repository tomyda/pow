import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has valid email domain
    const email = session.user.email
    if (!email || !email.endsWith("@usehorizon.ai")) {
      return NextResponse.json({ error: "Invalid email domain" }, { status: 403 })
    }

    // Return success with user info
    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
      }
    })
  } catch (error) {
    console.error("Error in test-auth:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}