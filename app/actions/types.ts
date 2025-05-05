import type { User, VotingSession } from "@/types"

export interface Vote {
  id: string
  voter_id: string
  votee_id: string
  created_at: string
  week_number?: number
  year?: number
  session?: VotingSession
  value?: string
  reason?: string
  honorable_mentions?: string
}

export interface SessionWithVotes extends VotingSession {
  votes: Vote[]
}

export interface VoteWithUsers extends Vote {
  voter: User
  votee: User
}

export interface VoteeResult {
  user: User
  votes: VoteWithUsers[]
  voteCount: number
}

export interface ApiResponse<T> {
  data?: T
  error?: Error
}

export class ApiError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
} 