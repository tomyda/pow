"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { User } from "@/types"
import { UserCard } from "@/components/user-card"
import { VoteModal } from "@/app/components/vote-modal"
import { useToast } from "@/hooks/use-toast"
import { getUsers, submitVote, getCurrentVote } from "@/app/actions"

interface VotingSession {
  id: number
  week_number: number
  year: number
  status: string
  created_at: string
}

interface VoteResult {
  user: User
  voteCount: number
}

interface VoteData {
  votee_id: string
  users: User
}

interface SupabaseError {
  message: string
  code?: string
  details?: string
}

export default function SessionPage() {
  const params = useParams()
  const [session, setSession] = useState<VotingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<VoteResult[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false)
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = getSupabase()

  useEffect(() => {
    async function fetchSessionData() {
      try {
        setLoading(true)
        // Get current user
        const { data: { session: authSession } } = await supabase.auth.getSession()
        if (!authSession) {
          throw new Error("Not authenticated")
        }
        setUserId(authSession.user.id)

        // Get session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('voting_sessions')
          .select('*')
          .eq('id', params.id)
          .single()

        if (sessionError) throw sessionError
        setSession(sessionData)

        // If session is closed, fetch voting results
        if (sessionData.status === 'CLOSED') {
          const { data: votesData, error: votesError } = await supabase
            .from('votes')
            .select(`
              votee_id,
              users!votes_votee_id_fkey (
                id,
                name,
                email,
                avatar_url,
                created_at
              )
            `)
            .eq('session', sessionData.id)

          if (votesError) throw votesError

          // Process votes into results
          const voteCount = (votesData as unknown as VoteData[]).reduce((acc: Record<string, number>, vote) => {
            const voteeId = vote.votee_id
            acc[voteeId] = (acc[voteeId] || 0) + 1
            return acc
          }, {})

          const processedResults = Object.entries(voteCount)
            .map(([userId, count]) => {
              const voteData = (votesData as unknown as VoteData[]).find(v => v.votee_id === userId)
              if (!voteData?.users) return null
              return {
                user: voteData.users,
                voteCount: count
              }
            })
            .filter((result): result is VoteResult => result !== null)
            .sort((a, b) => b.voteCount - a.voteCount)

          setResults(processedResults)
        } else {
          // If session is open, fetch users and check if user has voted
          const result = await getUsers()
          if ('error' in result) {
            const errorMessage = typeof result.error === 'string'
              ? result.error
              : (result.error as SupabaseError).message
            throw new Error(errorMessage)
          }
          setUsers(result.users)

          const { vote } = await getCurrentVote(authSession.user.id)
          if (vote) {
            setSelectedUser(vote.votee_id)
            setHasVoted(true)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [params.id, supabase])

  const handleVoteClick = (user: User) => {
    if (hasVoted) return
    setSelectedUserData(user)
    setIsVoteModalOpen(true)
  }

  const handleVoteSubmit = async (reason: string, honorableMentions: string) => {
    if (!userId || !selectedUserData || !session) {
      toast({
        title: "Error",
        description: "Please try voting again",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const { success, error: voteError } = await submitVote(userId, selectedUserData.id, reason, honorableMentions)

      if (voteError) {
        const errorMessage = typeof voteError === 'string'
          ? voteError
          : (voteError as SupabaseError).message
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      setSelectedUser(selectedUserData.id)
      setHasVoted(true)
      setIsVoteModalOpen(false)
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded",
      })
    } catch (err) {
      console.error("Error submitting vote:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit vote",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!session) {
    return <div>Session not found</div>
  }

  if (session.status === 'CLOSED') {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">
          Results - Week {session.week_number}, {session.year}
        </h1>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={result.user.id} className="flex items-center justify-between p-4 bg-card rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">{index + 1}</div>
                <div>
                  <div className="font-semibold">{result.user.name}</div>
                  <div className="text-sm text-muted-foreground">{result.user.email}</div>
                </div>
              </div>
              <div className="text-lg font-semibold">
                {result.voteCount} vote{result.voteCount !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Vote - Week {session.week_number}, {session.year}
        </h1>
        <p className="text-muted-foreground">
          Choose your colleague of the week
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            isSelected={selectedUser === user.id}
            hasVoted={hasVoted}
            onVote={() => handleVoteClick(user)}
          />
        ))}
      </div>

      <VoteModal
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        onConfirm={handleVoteSubmit}
        selectedUser={selectedUserData}
      />
    </div>
  )
}