"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getSupabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AuthButtonProps {
  onAuthChange?: () => void
}

export function AuthButton({ onAuthChange }: AuthButtonProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Get the Supabase client once
  const supabase = getSupabase()

  useEffect(() => {
    let mounted = true

    async function getUser() {
      try {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
  }, [onAuthChange, supabase])

  const handleSignIn = async () => {
    try {
      // Use a simpler approach for Google auth
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
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">{user.email}</span>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  ) : (
    <Button onClick={handleSignIn}>Sign in with Google</Button>
  )
}
