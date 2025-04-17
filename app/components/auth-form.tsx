import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getSupabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSignIn = async () => {
    try {
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
    }
  }

  const handleSignUp = async () => {
    try {
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
      <div className='grid gap-4 py-4'>
        <div className='grid gap-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='name@usehorizon.ai'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className='flex justify-between flex-col items-center'>
          <Button
            onClick={isSignUp ? handleSignUp : handleSignIn}
            className='w-full'
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>

          <Button
            variant='link'
            onClick={() => setIsSignUp(!isSignUp)}
            className='px-0 mt-4'
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
