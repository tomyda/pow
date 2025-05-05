import { UserCard } from "@/components/user-card"
import { UserCardSkeleton } from "@/components/user-card-skeleton"
import type { User } from "@/types"

interface UserVotingGridProps {
  users: User[]
  selectedUser: string | null
  hasVoted: boolean
  isLoading: boolean
  onUserClick: (user: User) => void
}

export function UserVotingGrid({ 
  users, 
  selectedUser, 
  hasVoted, 
  isLoading, 
  onUserClick 
}: UserVotingGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          isSelected={selectedUser === user.id}
          hasVoted={hasVoted}
          onVote={() => onUserClick(user)}
        />
      ))}
    </div>
  )
} 