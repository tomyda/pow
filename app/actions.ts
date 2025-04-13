"use server"

import { revalidatePath } from "next/cache"
import { createActionSupabaseClient } from "@/lib/supabase-server"
import { getCurrentWeekAndYear } from "@/lib/utils"
import type { User, Winner } from "@/types"
import { SupabaseClient } from "@supabase/supabase-js"

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

// Get all users
export async function getUsers() {
  try {
    const supabase = await createActionSupabaseClient()
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("name")

    if (usersError) {
      throw usersError
    }

    return { users: users as User[] }
  } catch (error: unknown) {
    console.error("Error fetching users:", error)

    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes("Too Many Requests")) {
      return { error: "Rate limit exceeded. Please try again later." }
    }

    // Return a structured error object
    return {
      error: {
        message: error instanceof Error ? error.message : "Failed to fetch users",
        code: error instanceof Error ? (error as any).code : undefined,
        details: error instanceof Error ? (error as any).details : undefined,
      },
    }
  }
}

// Get current user's vote for this week
export async function getCurrentVote(userId: string) {
  try {
    const supabase = await createActionSupabaseClient()
    const { weekNumber, year } = getCurrentWeekAndYear()

    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .select("*")
      .eq("voter_id", userId)
      .eq("week_number", weekNumber)
      .eq("year", year)
      .single()

    if (voteError) {
      throw voteError
    }

    return { vote }
  } catch (error: unknown) {
    console.error("Error fetching current vote:", error)

    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes("Too Many Requests")) {
      return { error: "Rate limit exceeded. Please try again later." }
    }

    // Return a structured error object
    return {
      error: {
        message: error instanceof Error ? error.message : "Failed to fetch current vote",
        code: error instanceof Error ? (error as any).code : undefined,
        details: error instanceof Error ? (error as any).details : undefined,
      },
    }
  }
}

// Submit a vote
export async function submitVote(voterId: string, voteeId: string) {
  try {
    const supabase = await createActionSupabaseClient()
    const { weekNumber, year } = getCurrentWeekAndYear()

    const { error: voteError } = await supabase
      .from("votes")
      .upsert({
        voter_id: voterId,
        votee_id: voteeId,
        week_number: weekNumber,
        year: year,
      })

    if (voteError) {
      throw voteError
    }

    return { success: true }
  } catch (error: unknown) {
    console.error("Error submitting vote:", error)

    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes("Too Many Requests")) {
      return { error: "Rate limit exceeded. Please try again later." }
    }

    // Return a structured error object
    return {
      error: {
        message: error instanceof Error ? error.message : "Failed to submit vote",
        code: error instanceof Error ? (error as any).code : undefined,
        details: error instanceof Error ? (error as any).details : undefined,
      },
    }
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
