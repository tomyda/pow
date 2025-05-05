import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getSupabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabase()
      console.log('Attempting to sign in...')

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        throw error
      }

      toast({
        title: 'Signed in',
        description: 'You have been signed in successfully'
      })

      router.push('/')
    } catch (error: any) {
      console.error('Error signing in:', error)
      toast({
        title: 'Error signing in',
        description: error?.message || 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabase()
      console.log('Attempting to sign up...')

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        console.error('Sign up error:', error)
        throw error
      }

      // Check if we have a session after signup
      if (data?.session) {
        toast({
          title: 'Signed up successfully',
          description: 'Welcome to Horizon!'
        })
        router.push('/')
      } else {
        setShowConfirmation(true)
      }
    } catch (error: any) {
      console.error('Error signing up:', error)
      toast({
        title: 'Error signing up',
        description: error?.message || 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabase()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }
      
      // The redirect happens automatically, no need to navigate
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      toast({
        title: 'Error signing in with Google',
        description: error?.message || 'Please try again later',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  if (showConfirmation) {
    return (
      <div className='text-center space-y-4'>
        <h3 className='text-lg font-semibold'>Check your email</h3>
        <p className='text-muted-foreground'>
          We've sent you a confirmation email. Please check your inbox and
          follow the instructions to complete your registration.
        </p>
        <Button
          variant='link'
          onClick={() => {
            setShowConfirmation(false)
            setIsSignUp(false)
          }}
        >
          Back to Sign In
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className='text-center'>
        <h2 className='mt-6 text-3xl font-bold tracking-tight'>
          {isSignUp ? 'Register' : 'Log in'}
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          {isSignUp
            ? 'Register to access Person of the Week'
            : 'Log in to access Person of the Week'}
        </p>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2 mt-4"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="relative my-4">
        <Separator className="absolute inset-0 flex items-center" />
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>
      
      <div className='grid gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='name@usehorizon.ai'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className='flex justify-between flex-col items-center'>
          <Button
            onClick={isSignUp ? handleSignUp : handleSignIn}
            className='w-full'
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>

          <Button
            variant='link'
            onClick={() => setIsSignUp(!isSignUp)}
            className='px-0 mt-4'
            disabled={isLoading}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Button>
        </div>
      </div>
    </>
  )
}
