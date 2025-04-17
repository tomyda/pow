import type { User, Vote } from "@/types"

export interface VoteWithUsers extends Vote {
  voter: User
  votee: User
}

export interface VoteeResult {
  user: User
  votes: VoteWithUsers[]
  voteCount: number
}

export interface VotingSessionResults {
  results: VoteeResult[]
  error?: string
}