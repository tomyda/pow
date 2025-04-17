"use server"

import { revalidatePath } from "next/cache"
import { createActionSupabaseClient } from "@/lib/supabase-server"
import { getCurrentWeekAndYear } from "@/lib/utils"
import type { User, VotingSession } from "@/types"
import { SupabaseClient } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase"

// Helper function to safely make Supabase requests with rate limiting
async function safeSupabaseRequest<T>(
  requestFn: (supabase: SupabaseClient) => Promise<T>
): Promise<T> {
  try {
    const supabase = await createActionSupabaseClient()
    return await requestFn(supabase)
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unknown error occurred")
  }
}

// Get all users with their latest win information
export async function getUsers() {
  try {
    const supabase = await createActionSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')

    if (error) {
      return { error }
    }

    return { users: data as User[] }
  } catch (error) {
    return { error }
  }
}

interface Vote {
  id: string
  voter_id: string
  votee_id: string
  created_at: string
}

interface SessionWithVotes extends VotingSession {
  votes: Vote[]
}

interface VoteWithUsers extends Vote {
  voter: User
  votee: User
}

interface VoteeResult {
  user: User
  votes: VoteWithUsers[]
  voteCount: number
}

// Get voting sessions
export async function getVotingSessions() {
  try {
    const supabase = await createActionSupabaseClient()

    // First get all sessions with votes and user information
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
      return { error: sessionError }
    }

    if (!sessions) {
      console.error("No sessions data returned")
      return { error: new Error("No sessions data returned") }
    }

    // For each session, fetch the user information for voters and votees
    const processedSessions = await Promise.all((sessions as SessionWithVotes[]).map(async (session) => {
      const votes = session.votes || []

      // Get unique user IDs from both voters and votees
      const userIds = [...new Set([
        ...votes.map((v: Vote) => v.voter_id),
        ...votes.map((v: Vote) => v.votee_id)
      ])]

      // Fetch user information for all involved users
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      const userMap = (users || []).reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {} as Record<string, User>)

      // Process votes with user information
      const processedVotes = votes.map((vote: Vote) => ({
        ...vote,
        voter: userMap[vote.voter_id],
        votee: userMap[vote.votee_id]
      }))

      // Calculate winner
      const voteCounts: Record<string, number> = {}
      processedVotes.forEach((vote) => {
        const voteeId = vote.votee_id
        voteCounts[voteeId] = (voteCounts[voteeId] || 0) + 1
      })

      // Find winner
      let winner = null
      let maxVotes = 0
      Object.entries(voteCounts).forEach(([voteeId, count]) => {
        if (count > maxVotes) {
          maxVotes = count
          winner = userMap[voteeId] || null
        }
      })

      // Get unique voters
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

    return { sessions: processedSessions }
  } catch (error) {
    console.error("Unexpected error in getVotingSessions:", error)
    return { error }
  }
}


// Get current user's vote for this week
export async function getCurrentVoteInVotingSession(userId: string, votingSessionId: number) {
  try {
    const supabase = await createActionSupabaseClient()
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('voter_id', userId)
      .eq('session', votingSessionId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return { error }
    }

    return { vote: data }
  } catch (error) {
    return { error }
  }
}

// Create a new voting session
export async function createVotingSession(weekNumber: number, year: number) {
  try {
    const supabase = await createActionSupabaseClient()

    // Check if a session already exists for this week and year
    const { data: existingSession, error: checkError } = await supabase
      .from('voting_sessions')
      .select('id')
      .eq('week_number', weekNumber)
      .eq('year', year)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return { error: checkError }
    }

    if (existingSession) {
      return { error: 'A voting session already exists for this week' }
    }

    // Create new session
    const { data: newSession, error } = await supabase
      .from('voting_sessions')
      .insert({
        week_number: weekNumber,
        year: year,
        status: 'OPEN',
      })
      .select()
      .single()

    if (error) {
      return { error }
    }

    return { session: newSession }
  } catch (error) {
    return { error }
  }
}

// Submit a vote
export async function submitVote(
  voterId: string,
  voteeId: string,
  reason: string,
  honorableMentions: string,
  sessionId?: number
) {
  try {
    const supabase = await createActionSupabaseClient()

    // If no session ID is provided, get the current active session
    if (!sessionId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('votes')
        .select('id')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (sessionError) {
        return { error: sessionError }
      }
      sessionId = sessionData.id
    }

    // Check if user has already voted in this session
    const { data: existingVote, error: checkError } = await supabase
      .from('votes')
      .select('id')
      .eq('voter_id', voterId)
      .eq('session', sessionId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return { error: checkError }
    }

    if (existingVote) {
      return { error: 'You have already voted in this session' }
    }

    // Submit the vote
    const { error } = await supabase
      .from('votes')
      .insert({
        voter_id: voterId,
        votee_id: voteeId,
        reason,
        honorable_mentions: honorableMentions,
        session: sessionId,
      })

    if (error) {
      return { error }
    }

    return { success: true }
  } catch (error) {
    return { error }
  }
}

// Test function to verify Supabase client setup
export async function testSupabaseSetup() {
  try {
    const supabase = await createActionSupabaseClient()

    // Try to get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { success: false, error: authError.message }
    }

    // Try a simple database query
    const { data: testData, error: queryError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (queryError) {
      return { success: false, error: queryError.message }
    }

    return {
      success: true,
      data: {
        hasUser: !!user,
        hasDbAccess: !!testData
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Close an existing voting session
export async function closeVotingSession(sessionId: number) {
  try {
    const supabase = await createActionSupabaseClient()

    const { error } = await supabase
      .from('voting_sessions')
      .update({ status: 'CLOSED' })
      .eq('id', sessionId)

    if (error) {
      return { error }
    }

    return { success: true }
  } catch (error) {
    return { error }
  }
}

// Get voting session results with user information
export async function getVotingSessionResults(sessionId: number): Promise<{ results: VoteeResult[], error?: Error }> {
  try {
    const supabase = await createActionSupabaseClient()

    // First check if session exists and is closed
    const { data: session, error: sessionError } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      return { results: [], error: new Error('Voting session not found') }
    }

    if (session.status !== 'CLOSED') {
      return { results: [], error: new Error('Voting session is not closed yet') }
    }

    // Get all votes for this session
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('session', sessionId)

    if (votesError) {
      return { results: [], error: votesError }
    }

    if (!votes || votes.length === 0) {
      return { results: [] }
    }

    // Get unique user IDs from both voters and votees
    const userIds = [...new Set([
      ...votes.map(v => v.voter_id),
      ...votes.map(v => v.votee_id)
    ])]

    // Fetch user information for all involved users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)

    if (usersError) {
      return { results: [], error: usersError }
    }

    const userMap = (users || []).reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, User>)

    // Process votes with user information
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

    // Convert to array and sort by vote count
    const results = Array.from(voteeMap.values())
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 3) // Get top 3

    return { results }
  } catch (error) {
    console.error("Error in getVotingSessionResults:", error)
    return { results: [], error: error instanceof Error ? error : new Error('An unknown error occurred') }
  }
}
