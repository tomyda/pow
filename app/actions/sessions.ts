import { createActionSupabaseClient } from "@/lib/supabase-actions"
import { ApiResponse, SessionWithVotes, Vote, VoteWithUsers, VoteeResult, ApiError } from "./types"
import type { User } from "@/types"
import { handleSupabaseError, createUserMap } from "./utils"

// Get voting sessions
export async function getVotingSessions(): Promise<ApiResponse<SessionWithVotes[]>> {
  try {
    const supabase = await createActionSupabaseClient()

    const { data: sessions, error: sessionError } = await supabase
      .from('voting_sessions')
      .select(`
        *,
        votes(
          id,
          voter_id,
          votee_id,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (sessionError) {
      console.error("Supabase query error:", sessionError)
      return { error: handleSupabaseError(sessionError) }
    }

    if (!sessions) {
      console.error("No sessions data returned")
      return { error: new ApiError("No sessions data returned") }
    }

    const processedSessions = await Promise.all((sessions as SessionWithVotes[]).map(async (session) => {
      const votes = session.votes || []
      const userIds = [...new Set([
        ...votes.map((v: Vote) => v.voter_id),
        ...votes.map((v: Vote) => v.votee_id)
      ])]

      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      const userMap = createUserMap(users || [])
      const processedVotes = votes.map((vote: Vote) => ({
        ...vote,
        voter: userMap[vote.voter_id],
        votee: userMap[vote.votee_id]
      }))

      const voteCounts: Record<string, number> = {}
      processedVotes.forEach((vote) => {
        const voteeId = vote.votee_id
        voteCounts[voteeId] = (voteCounts[voteeId] || 0) + 1
      })

      let winner = null
      let maxVotes = 0
      Object.entries(voteCounts).forEach(([voteeId, count]) => {
        if (count > maxVotes) {
          maxVotes = count
          winner = userMap[voteeId] || null
        }
      })

      const voters = [...new Set(votes.map((v: Vote) => v.voter_id))]
        .map(id => userMap[id])
        .filter((user): user is User => user !== undefined)

      return {
        ...session,
        winner,
        voters,
        total_votes: votes.length
      }
    }))

    return { data: processedSessions }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

// Create a new voting session
export async function createVotingSession(weekNumber: number): Promise<ApiResponse<any>> {
  try {
    const supabase = await createActionSupabaseClient()

    const { data: existingSession, error: checkError } = await supabase
      .from('voting_sessions')
      .select('id')
      .eq('week_number', weekNumber)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // "More than 1 or no items where returned when requesting a singular response. See Singular or Plural."
      return { error: handleSupabaseError(checkError) } 
    }

    if (existingSession) {
      return { error: new ApiError("A voting session already exists for this week") }
    }

    const { data: newSession, error } = await supabase
      .from('voting_sessions')
      .insert({
        week_number: weekNumber,
        status: 'OPEN',
      })
      .select()
      .single()

    if (error) {
      return { error: handleSupabaseError(error) }
    }

    return { data: newSession }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

// Close an existing voting session
export async function closeVotingSession(sessionId: number): Promise<ApiResponse<void>> {
  try {
    const supabase = await createActionSupabaseClient()

    const { error } = await supabase
      .from('voting_sessions')
      .update({ status: 'CLOSED' })
      .eq('id', sessionId)

    if (error) {
      return { error: handleSupabaseError(error) }
    }

    return { data: undefined }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

// Get voting session results
export async function getVotingSessionResults(sessionId: number): Promise<ApiResponse<VoteeResult[]>> {
  try {
    const supabase = await createActionSupabaseClient()

    const { data: session, error: sessionError } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      return { error: handleSupabaseError(sessionError) }
    }

    if (session.status !== 'CLOSED') {
      return { error: new ApiError("Voting session is not closed yet") }
    }

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('session', sessionId)

    if (votesError) {
      return { error: handleSupabaseError(votesError) }
    }

    if (!votes || votes.length === 0) {
      return { data: [] }
    }

    const userIds = [...new Set([
      ...votes.map(v => v.voter_id),
      ...votes.map(v => v.votee_id)
    ])]

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)

    if (usersError) {
      return { error: handleSupabaseError(usersError) }
    }

    const userMap = createUserMap(users || [])
    const voteeMap = new Map<string, VoteeResult>()

    votes.forEach(vote => {
      const voteeId = vote.votee_id
      if (!voteeMap.has(voteeId)) {
        voteeMap.set(voteeId, {
          user: userMap[voteeId],
          votes: [],
          voteCount: 0
        })
      }
      const voteeResult = voteeMap.get(voteeId)!
      const processedVote: VoteWithUsers = {
        ...vote,
        voter: userMap[vote.voter_id],
        votee: userMap[vote.votee_id]
      }
      voteeResult.votes.push(processedVote)
      voteeResult.voteCount++
    })

    const results = Array.from(voteeMap.values())
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 3)

    return { data: results }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}
