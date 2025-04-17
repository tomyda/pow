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
      <div className="border rounded-lg max-w-md space-y-8 p-8 min-w-lg">
          <AuthForm />
      </div>
    </div>
  )
}