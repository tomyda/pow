import { VoteModal } from "@/app/components/vote-modal"
import { SessionHeader } from "./session-header"
import { UserVotingGrid } from "./user-voting-grid"
import type { User } from "@/types"
import { useUserData } from "../hooks/use-user-data"
import { useVoting } from "../hooks/use-voting"

interface VotingSession {
  id: number
  week_number: number
  year: number
  status: string
  created_at: string
}

interface OpenSessionProps {
  votingSession: VotingSession
}

export function OpenVotingSession({ votingSession }: OpenSessionProps) {
  const { usersList, authSession, isAdmin, isLoading: usersLoading } = useUserData()
  const {
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
  } = useVoting(votingSession, authSession)

  return (
    <div className="container mx-auto py-8">
      <SessionHeader
        title="Vote for Person of the Week"
        weekNumber={votingSession.week_number}
        isAdmin={isAdmin}
        isClosing={isClosing}
        onCloseSession={handleCloseSession}
      />

      {hasVoted ? (
        <div className="bg-green-50 border border-green-100 rounded-md p-4 mb-6">
          <p className="text-green-800">
            Thanks for voting! Results will be available once the voting session is closed.
          </p>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
          <p className="text-blue-800">
            Select a team member to vote for them as Person of the Week
          </p>
        </div>
      )}

      <UserVotingGrid
        users={usersList}
        selectedUser={selectedUser}
        hasVoted={hasVoted}
        isLoading={usersLoading}
        onUserClick={handleVoteClick}
      />

      {selectedUserData && (
        <VoteModal
          selectedUser={selectedUserData}
          isOpen={isVoteModalOpen}
          onClose={() => setIsVoteModalOpen(false)}
          onConfirm={handleVoteSubmit}
        />
      )}
    </div>
  )
} 