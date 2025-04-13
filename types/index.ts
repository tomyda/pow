export interface User {
  id: string
  name: string
  email: string
  avatar_url: string | null
  created_at: string
  is_admin: boolean
}

export interface Vote {
  id: string
  voter_id: string
  votee_id: string
  created_at: string
  week_number: number
  year: number
  session: VotingSession
  reason: string
  honorable_mentions: string
}

export interface VotingSession {
  id: number
  created_at: string
  week_number: number
  status: string
}
