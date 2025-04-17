"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { User } from "@/types"
import { UserCard } from "@/components/user-card"
import { VoteModal } from "@/app/components/vote-modal"
import { useToast } from "@/hooks/use-toast"
import { getUsers, submitVote, getCurrentVoteInVotingSession } from "@/app/actions"
import { AuthSession } from '@supabase/supabase-js'

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

export default function VotingSessionPage() {
  const params = useParams()
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabase()

  useEffect(() => {
    async function fetchSessionData() {
      try {
        setLoading(true)
        const { data: { session: authSession } } = await supabase.auth.getSession()
        if (!authSession) {
          throw new Error("Not authenticated")
        }

        // Get voting session
        const { data: sessionData, error: sessionError } = await supabase
          .from('voting_sessions')
          .select('*')
          .eq('id', params.id)
          .single()

        if (sessionError) throw sessionError
        setVotingSession(sessionData)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [params.id])

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

  if (!votingSession) {
    return <div>Session not found</div>
  }

  if (votingSession.status === 'CLOSED') {
    return <ClosedVotingSession />
  }

  return (
    <OpenVotingSession votingSession={votingSession} />
  )
}

const ClosedVotingSession = () => {
  return (
    <div className="container mx-auto py-8">
      <Link
        href="/"
        className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        ← Back to Sessions
      </Link>
      <h1>Voting session finished</h1>
    </div>
  )
}

const OpenVotingSession = ({ votingSession }: { votingSession: VotingSession }) => {
  const [results, setResults] = useState<VoteResult[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false)
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null)
  const [authSession, setAuthSession] = useState<AuthSession | null>(null)
  const { toast } = useToast()
  const supabase = getSupabase()

  useEffect(() => {
    async function initialize() {
      try {
        // Fetch all users
        const { users: allUsers, error: usersError } = await getUsers()
        if (usersError) {
          throw usersError
        }
        if (allUsers) {
          setUsers(allUsers)
        }

        // Check if user has already voted
        const { data: { session: authSession } } = await supabase.auth.getSession()
        if (!authSession) {
          throw new Error("Not authenticated")
        }
        setAuthSession(authSession)
        const { vote, error: voteError } = await getCurrentVoteInVotingSession( authSession.user.id , votingSession.id)
        if (voteError && typeof voteError === 'object' && 'code' in voteError && voteError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw voteError
        }
        if (vote) {
          setHasVoted(true)
          setSelectedUser(vote.votee_id)
        }
      } catch (err) {
        console.error("Error initializing:", err)
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to initialize voting session",
          variant: "destructive",
        })
      }
    }

    initialize()
  }, [votingSession])

  console.log('votingSession', votingSession)
  console.log('selectedUserData', selectedUserData)
  console.log('hasVoted', hasVoted)

  const handleVoteClick = (user: User) => {
    if (hasVoted) return
    setSelectedUserData(user)
    setIsVoteModalOpen(true)
  }

  const handleVoteSubmit = async (reason: string, honorableMentions: string) => {
    console.log('step 1')
    if (!authSession || !selectedUserData || !votingSession) {
      toast({
        title: "Error",
        description: "Please try voting again",
        variant: "destructive",
      })
      return
    }

    console.log('step 2')

    try {
      setSubmitting(true)
      const { success, error: voteError } = await submitVote(authSession.user.id, selectedUserData.id, reason, honorableMentions, votingSession.id)

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
        title: "Success!",
        description: `You voted for ${selectedUserData.name}`,
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

  return (
    <div className="container mx-auto py-8">
      <Link
        href="/"
        className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        ← Back to Sessions
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Vote - Week {votingSession.week_number}
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