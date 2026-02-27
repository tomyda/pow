"use server"

import { createActionSupabaseClient } from "@/lib/supabase-actions"
import { ApiResponse, ApiError, VoteWithUsers } from "./types"
import { handleSupabaseError, createUserMap } from "./utils"
import type { User } from "@/types"

export async function getAnalyticsData(): Promise<ApiResponse<{
  valueDistribution: { value: string; count: number }[]
  peopleRanking: { user: User; totalVotes: number }[]
}>> {
  try {
    const supabase = await createActionSupabaseClient()

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('votee_id, value')

    if (votesError) return { error: handleSupabaseError(votesError) }
    if (!votes || votes.length === 0) {
      return { data: { valueDistribution: [], peopleRanking: [] } }
    }

    const valueCounts: Record<string, number> = {}
    const voteeCounts: Record<string, number> = {}

    votes.forEach((vote) => {
      if (vote.value) {
        valueCounts[vote.value] = (valueCounts[vote.value] || 0) + 1
      }
      voteeCounts[vote.votee_id] = (voteeCounts[vote.votee_id] || 0) + 1
    })

    const valueDistribution = Object.entries(valueCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)

    const voteeIds = Object.keys(voteeCounts)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', voteeIds)

    if (usersError) return { error: handleSupabaseError(usersError) }

    const userMap = createUserMap(users || [])
    const peopleRanking = Object.entries(voteeCounts)
      .map(([userId, totalVotes]) => ({ user: userMap[userId] as User, totalVotes }))
      .filter((entry) => entry.user !== undefined)
      .sort((a, b) => b.totalVotes - a.totalVotes)

    return { data: { valueDistribution, peopleRanking } }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

export async function getUserVotes(userId: string): Promise<ApiResponse<(VoteWithUsers & { session_week: number })[]>> {
  try {
    const supabase = await createActionSupabaseClient()

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*, voting_sessions!inner(week_number)')
      .eq('voter_id', userId)
      .order('created_at', { ascending: false })

    if (votesError) return { error: handleSupabaseError(votesError) }
    if (!votes || votes.length === 0) return { data: [] }

    const voteeIds = [...new Set(votes.map((v) => v.votee_id))]
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', voteeIds)

    if (usersError) return { error: handleSupabaseError(usersError) }

    const userMap = createUserMap(users || [])

    const voterUser = (await supabase.from('users').select('*').eq('id', userId).single()).data

    const result = votes.map((vote) => ({
      ...vote,
      voter: voterUser as User,
      votee: userMap[vote.votee_id] as User,
      session_week: (vote.voting_sessions as any)?.week_number ?? vote.week_number,
    }))

    return { data: result }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

// Get current user's vote for this week
export async function getCurrentVoteInVotingSession(
  userId: string,
  votingSessionId: number
): Promise<ApiResponse<any>> {
  try {
    const supabase = await createActionSupabaseClient()
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('voter_id', userId)
      .eq('session', votingSessionId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "More than 1 or no items where returned when requesting a singular response. See Singular or Plural."
      return { error: handleSupabaseError(error) }
    }

    return { data }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

// Submit a vote
export async function submitVote(
  voterId: string,
  voteeId: string,
  value: string,
  reason: string,
  honorableMentions: string,
  sessionId?: number
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createActionSupabaseClient()

    if (!sessionId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('votes')
        .select('id')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (sessionError) {
        return { error: handleSupabaseError(sessionError) }
      }
      sessionId = sessionData.id
    }

    const { data: existingVote, error: checkError } = await supabase
      .from('votes')
      .select('id')
      .eq('voter_id', voterId)
      .eq('session', sessionId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return { error: handleSupabaseError(checkError) }
    }

    if (existingVote) {
      return { error: new ApiError("You have already voted in this session") }
    }

    const { error } = await supabase
      .from('votes')
      .insert({
        voter_id: voterId,
        votee_id: voteeId,
        value,
        reason,
        honorable_mentions: honorableMentions,
        session: sessionId,
      })

    if (error) {
      return { error: handleSupabaseError(error) }
    }

    return { data: undefined }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}
