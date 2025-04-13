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
    const supabase = getSupabase()
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

// Get voting sessions
export async function getVotingSessions() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('voting_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { error }
    }

    return { sessions: data as VotingSession[] }
  } catch (error) {
    return { error }
  }
}


// Get current user's vote for this week
export async function getCurrentVote(userId: string) {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('voter_id', userId)
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
    const supabase = getSupabase()

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
    const supabase = getSupabase()

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
    const supabase = getSupabase()

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
