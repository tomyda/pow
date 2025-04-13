"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthButton } from "@/components/auth-button"
import { getSupabase } from "@/lib/supabase"

export default function AuthPage() {
  const router = useRouter()
  const supabase = getSupabase()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push("/") // Redirect to home if already authenticated
      }
    }

    checkSession()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Welcome to Horizon
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access Person of the Week
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <AuthButton />
          </div>
        </div>
      </div>
    </div>
  )
}