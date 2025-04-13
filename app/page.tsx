"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/types"
import { UserCard } from "@/components/user-card"
import { AuthButton } from "@/components/auth-button"
import { getSupabase } from "@/lib/supabase"
import { getCurrentWeekAndYear } from "@/lib/utils"
import { getUsers, submitVote, getCurrentVote } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { ensureHorizonUser } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"

// Helper function to extract error message from various error types
function getErrorMessage(error: any): string {
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    // Try to extract error message from common error object patterns
    if (error.message) return typeof error.message === "string" ? error.message : JSON.stringify(error.message)
    if (error.error) return typeof error.error === "string" ? error.error : JSON.stringify(error.error)
    if (error.statusText) return error.statusText
    if (error.code) return `Error code: ${error.code}`
  }
  return JSON.stringify(error) || "An unknown error occurred"
}

// Add proper TypeScript types for the debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = undefined
      func(...args)
    }

    if (timeout !== undefined) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// Circuit breaker to prevent too many requests
function useCircuitBreaker(initialState = false, resetTimeMs = 30000) {
  const [isOpen, setIsOpen] = useState(initialState)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const open = useCallback(() => {
    setIsOpen(true)

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Set a timer to close the circuit breaker after resetTimeMs
    timerRef.current = setTimeout(() => {
      setIsOpen(false)
      timerRef.current = null
    }, resetTimeMs)
  }, [resetTimeMs])

  const close = useCallback(() => {
    setIsOpen(false)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { isOpen, open, close }
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { toast } = useToast()
  const { weekNumber, year } = getCurrentWeekAndYear()
  const searchParams = useSearchParams()
  const router = useRouter()
  const circuitBreaker = useCircuitBreaker()

  const handleVote = async (voteeId: string) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote",
        variant: "destructive",
      })
      return
    }

    // If circuit breaker is open, don't make the request
    if (circuitBreaker.isOpen) {
      toast({
        title: "Too Many Requests",
        description: "Please wait a moment before trying again.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      setSelectedUser(voteeId)

      const { success, error: voteError } = await submitVote(userId, voteeId)

      if (voteError) {
        const errorMessage = getErrorMessage(voteError)
        if (errorMessage.includes("Rate limit")) {
          // Open the circuit breaker
          circuitBreaker.open()

          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment before trying again.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
        return
      }

      setHasVoted(true)
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded",
      })
    } catch (err) {
      console.error("Error submitting vote:", err)
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    // Only retry if circuit breaker is closed
    if (!circuitBreaker.isOpen) {
      setRetryCount(retryCount + 1)
      // fetchData()
    } else {
      toast({
        title: "Too Many Requests",
        description: "Please wait a moment before trying again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Person of the Week</h1>
          <p className="text-muted-foreground">
            Vote for your colleague of the week (Week {weekNumber}, {year})
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : userId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUser === user.id}
              hasVoted={hasVoted}
              onVote={() => handleVote(user.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <h2 className="text-2xl font-semibold">Welcome to Horizon - Person of the Week</h2>
          <p className="text-muted-foreground">Please sign in to vote for your colleague of the week</p>
          <AuthButton />
        </div>
      )}
    </div>
  )
}
