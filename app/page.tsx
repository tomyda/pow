"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { AuthButton } from "@/components/auth-button"
import { getSupabase } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SessionCard } from "./components/session-card"
import { SessionManager } from "./components/session-manager"
import { AnalyticsTab } from "./components/analytics-tab"
import { YourVotesTab } from "./components/your-votes-tab"
import { VotingSession } from '@/types'
import { sessions as sessionsActions } from '@/app/actions/index'

export default function Home() {
  const [sessions, setSessions] = useState<VotingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = getSupabase()

  // Check if there's an open session
  const hasOpenSession = sessions.some(session => session.status === "OPEN")

  const loadSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching sessions...")
      const { data: sessionsData, error: sessionsError } = await sessionsActions.getVotingSessions()

      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError)
        const errorMessage = sessionsError.message || 'Failed to load sessions'
        throw new Error(errorMessage)
      }

      if (!sessionsData) {
        throw new Error("No sessions data returned")
      }

      console.log("Sessions data:", sessionsData)
      setSessions(sessionsData)
    } catch (err) {
      console.error("Full error object:", err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking authentication...")
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log("No session found, redirecting to auth...")
        router.push('/auth')
        return
      }

      console.log("User authenticated:", session.user.id)

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
      } else {
        console.log("User data:", userData)
        setIsAdmin(userData?.is_admin || false)
      }

      setUserId(session.user.id)
      await loadSessions()
    }

    checkAuth()

    // Add auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event)
      if (event === 'SIGNED_OUT' || !session) {
        console.log("User signed out, redirecting to auth...")
        setUserId(null)
        setIsAdmin(false)
        setSessions([])
        router.push('/auth')
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleRetry = () => {
    console.log("Retrying session load...")
    setRetryCount(prev => prev + 1)
    loadSessions()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Person of the Week</h1>
          <p className="text-muted-foreground">
            View and participate in weekly voting sessions
          </p>
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <Button
              variant="outline"
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
          {isAdmin && (
            <SessionManager
              onSessionCreated={loadSessions}
              hasOpenSession={hasOpenSession}
            />
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading sessions</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : userId ? (
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="your-votes">Your Votes</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No voting sessions found. {isAdmin && "Use the 'Create New Session' button to start one."}
                </div>
              ) : (
                sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    id={session.id}
                    weekNumber={session.week_number}
                    status={session.status}
                    createdAt={session.created_at}
                    winner={session.winner}
                    runners_up={session.runners_up}
                    voters={session.voters}
                    total_votes={session.total_votes}
                    isAdmin={isAdmin}
                    onSessionClosed={loadSessions}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="your-votes">
            <YourVotesTab userId={userId} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <h2 className="text-2xl font-semibold">Welcome to Horizon - Person of the Week</h2>
          <p className="text-muted-foreground">Please sign in to view and participate in voting sessions</p>
          <AuthButton />
        </div>
      )}
    </div>
  )
}
