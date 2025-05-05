import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { votes, sessions } from "@/app/actions/index"
import type { User } from "@/types"
import { AuthSession } from '@supabase/supabase-js'

const submitVote = votes.submitVote
const getCurrentVoteInVotingSession = votes.getCurrentVoteInVotingSession
const closeVotingSession = sessions.closeVotingSession

interface VotingSession {
  id: number
  week_number: number
  year: number
  status: string
  created_at: string
}

export function useVoting(votingSession: VotingSession | null, authSession: AuthSession | null) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false)
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function checkVoteStatus() {
      if (!authSession || !votingSession) {
        return
      }

      try {
        const { data: voteData, error: voteError } = await getCurrentVoteInVotingSession(
          authSession.user.id,
          votingSession.id
        )
        
        if (voteError) {
          toast({
            title: "Error",
            description: voteError.message,
            variant: "destructive",
          })
          return
        }
        
        if (voteData) {
          setHasVoted(true)
          setSelectedUser(voteData.votee_id)
        }
      } catch (err) {
        console.error("Error checking vote status:", err)
      }
    }

    checkVoteStatus()
  }, [authSession, votingSession])

  const handleVoteClick = (user: User) => {
    if (hasVoted) return
    setSelectedUserData(user)
    setIsVoteModalOpen(true)
  }

  const handleVoteSubmit = async (value: string, reason: string, honorableMentions: string) => {
    if (!authSession || !selectedUserData || !votingSession) {
      toast({
        title: "Error",
        description: "Please try voting again",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const { data, error } = await submitVote(
        authSession.user.id,
        selectedUserData.id,
        value,
        reason,
        honorableMentions,
        votingSession.id
      )

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (data !== undefined) {
        setSelectedUser(selectedUserData.id)
        setHasVoted(true)
        setIsVoteModalOpen(false)
        toast({
          title: "Success",
          description: `You voted for ${selectedUserData.name}`,
        })
      }
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

  const handleCloseSession = async () => {
    if (!votingSession) return
    
    try {
      setIsClosing(true)
      const { error } = await closeVotingSession(votingSession.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to close voting session",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Voting session closed successfully",
      })

      // Redirect to reveal results page
      router.push(`/voting-session/${votingSession.id}/reveal-results`)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to close session",
        variant: "destructive",
      })
    } finally {
      setIsClosing(false)
    }
  }

  return {
    selectedUser,
    hasVoted,
    submitting,
    isVoteModalOpen,
    setIsVoteModalOpen,
    selectedUserData,
    isClosing,
    handleVoteClick,
    handleVoteSubmit,
    handleCloseSession
  }
} 