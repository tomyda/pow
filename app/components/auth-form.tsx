import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getSupabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const { toast } = useToast()

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
    } catch (error: any) {
      console.error("Error signing up:", error)
      toast({
        title: "Error signing up",
        description: error?.message || "Please try again later",
        variant: "destructive",
      })
    }
  }

  return (
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
      <div className="flex justify-between flex-col items-center">
        <Button onClick={isSignUp ? handleSignUp : handleSignIn} className="w-full">
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button
          variant="link"
          onClick={() => setIsSignUp(!isSignUp)}
          className="px-0 mt-4"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </Button>

      </div>
    </div>
  )
}