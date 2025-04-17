"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { AuthForm } from "@/app/components/auth-form"

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
    <div className=" mt-10 flex items-center justify-center bg-background">
      <div className="border rounded-lg max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Welcome to Horizon
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access Person of the Week
          </p>
        </div>

        <div className="mt-8">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}