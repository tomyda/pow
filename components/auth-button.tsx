"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getSupabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface AuthButtonProps {
  onAuthChange?: () => void
}

export function AuthButton({ onAuthChange }: AuthButtonProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
      console.log("Attempting to sign in...")

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        throw error
      }

      setIsDialogOpen(false)
      toast({
        title: "Signed in",
        description: "You have been signed in successfully",
      })
    } catch (error: any) {
      console.error("Error signing in:", error)
      toast({
        title: "Error signing in",
        description: error?.message || "Please try again later",
        variant: "destructive",
      })
    }
  }

  const handleSignUp = async () => {
    try {
      const supabase = getSupabase()
      console.log("Attempting to sign up...")

      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error("Sign up error:", error)
        throw error
      }

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation email",
      })
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Error signing up:", error)
      toast({
        title: "Error signing up",
        description: error?.message || "Please try again later",
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
      toast({
        title: "Error signing out",
        description: "Please try again later",
        variant: "destructive",
      })
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Create an account" : "Sign in to your account"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@usehorizon.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-between">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="px-0"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
            <Button onClick={isSignUp ? handleSignUp : handleSignIn}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
