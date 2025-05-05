import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"

interface VotingSession {
  id: number
  week_number: number
  year: number
  status: string
  created_at: string
}

export function useSessionData(sessionId: string) {
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
          .eq('id', sessionId)
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
  }, [sessionId])

  return { votingSession, loading, error }
} 