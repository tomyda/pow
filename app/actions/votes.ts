"use server"

import { createActionSupabaseClient } from "@/lib/supabase-actions"
import { ApiResponse, ApiError } from "./types"
import { handleSupabaseError } from "./utils"

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
