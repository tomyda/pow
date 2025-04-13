export interface User {
  id: string
  name: string
  email: string
  avatar_url: string | null
  created_at: string
  last_win?: string | null
}

export interface Vote {
  id: string
  voter_id: string
  votee_id: string
  created_at: string
  week_number: number
  year: number
}

export interface Winner {
  id: string
  user_id: string
  week_number: number
  year: number
  created_at: string
}
