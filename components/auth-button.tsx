"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getSupabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { AuthChangeEvent, Session } from "@supabase/supabase-js"

interface AuthButtonProps {
  onAuthChange?: () => void
}

export function AuthButton({ onAuthChange }: AuthButtonProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    async function getUser() {
      try {
        const supabase = getSupabase()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (mounted) {
          setUser(user)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error getting auth user:", error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    getUser()

    const supabase = getSupabase()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (mounted) {
        setUser(session?.user ?? null)
        if (onAuthChange) {
          onAuthChange()
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [onAuthChange])

  const handleSignIn = async () => {
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Error signing in:", error)
      toast({
        title: "Error signing in",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      })
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  return user ? (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  ) : (
    <Button onClick={handleSignIn}>Sign In</Button>
  )
}
