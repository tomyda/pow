"use server"

import { revalidatePath } from "next/cache"
import { createActionSupabaseClient } from "@/lib/supabase-server"
import { getCurrentWeekAndYear } from "@/lib/utils"
import type { User, Winner } from "@/types"

// Helper function to handle Supabase responses with proper error handling
async function safeSupabaseRequest(requestFn) {
  try {
    // Add a delay to prevent rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500))

    const response = await requestFn()
    return response
  } catch (error) {
    console.error("Supabase request error:", error)

    // Check if it's a rate limit error
    if (error.message && typeof error.message === "string" && error.message.includes("Too Many Requests")) {
      return { error: "Rate limit exceeded. Please try again later." }
    }

    // Return a structured error object
    return {
      error: {
        message: error.message || "An error occurred while communicating with the database.",
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
    }
  }
}

// Fetch all users with their last win date
export async function getUsers() {
  try {
    // Add a delay to prevent rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500))

    const supabase = createActionSupabaseClient()

    // Use the safe request helper for users query
    const usersResponse = await safeSupabaseRequest(() => supabase.from("users").select("*"))

    if (usersResponse.error) {
      return { error: usersResponse.error }
    }

    const users = usersResponse.data || []

    // If we have no users, return an empty array to avoid further queries
    if (users.length === 0) {
      return { users: [] }
    }

    // Use the safe request helper for winners query
    const winnersResponse = await safeSupabaseRequest(() => supabase.from("winners").select("*"))

    if (winnersResponse.error) {
      return { error: winnersResponse.error }
    }

    const winners = winnersResponse.data || []

    // Map winners to users
    const usersWithLastWin = users.map((user: User) => {
      const userWins = winners.filter((winner: Winner) => winner.user_id === user.id)
      const lastWin =
        userWins.length > 0
          ? userWins.sort(
              (a: Winner, b: Winner) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )[0].created_at
          : null

      return {
        ...user,
        last_win: lastWin,
      }
    })

    return { users: usersWithLastWin }
  } catch (error) {
    console.error("Error fetching users:", error)

    // Check if it's a rate limit error
    if (error.message && typeof error.message === "string" && error.message.includes("Too Many Requests")) {
      return { error: "Rate limit exceeded. Please try again later." }
    }

    // Return a structured error object
    return {
      error: {
        message: error.message || "Failed to fetch users",
        code: error.code,
        details: error.details,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    }
  }
}

// Submit a vote
export async function submitVote(userId: string, voteeId: string) {
  try {
    const supabase = createActionSupabaseClient()
    const { weekNumber, year } = getCurrentWeekAndYear()

    // Check if user already voted this week
    const existingVoteResponse = await safeSupabaseRequest(() =>
      supabase.from("votes").select("*").eq("voter_id", userId).eq("week_number", weekNumber).eq("year", year).single(),
    )

    if (
      existingVoteResponse.error &&
      existingVoteResponse.error !== "Rate limit exceeded. Please try again later." &&
      existingVoteResponse.error.code !== "PGRST116"
    ) {
      throw existingVoteResponse.error
    }

    const existingVote = existingVoteResponse.data

    if (existingVote) {
      // Update existing vote
      const updateResponse = await safeSupabaseRequest(() =>
        supabase.from("votes").update({ votee_id: voteeId }).eq("id", existingVote.id),
      )

      if (updateResponse.error) {
        throw updateResponse.error
      }
    } else {
      // Insert new vote
      const insertResponse = await safeSupabaseRequest(() =>
        supabase.from("votes").insert({
          voter_id: userId,
          votee_id: voteeId,
          week_number: weekNumber,
          year: year,
        }),
      )

      if (insertResponse.error) {
        throw insertResponse.error
      }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error submitting vote:", error)

    // Check if it's a rate limit error
    if (error.message && typeof error.message === "string" && error.message.includes("Too Many Requests")) {
      return { error: "Rate limit exceeded. Please try again later." }
    }

    // Return a structured error object
    return {
      error: {
        message: error.message || "Failed to submit vote",
        code: error.code,
        details: error.details,
      },
    }
  }
}

// Get current user's vote for this week
export async function getCurrentVote(userId: string) {
  try {
    const supabase = createActionSupabaseClient()
    const { weekNumber, year } = getCurrentWeekAndYear()

    const response = await safeSupabaseRequest(() =>
      supabase.from("votes").select("*").eq("voter_id", userId).eq("week_number", weekNumber).eq("year", year).single(),
    )

    if (
      response.error &&
      response.error !== "Rate limit exceeded. Please try again later." &&
      response.error.code !== "PGRST116"
    ) {
      throw response.error
    }

    return { vote: response.data }
  } catch (error) {
    console.error("Error fetching current vote:", error)

    // Check if it's a rate limit error
    if (error.message && typeof error.message === "string" && error.message.includes("Too Many Requests")) {
      return { error: "Rate limit exceeded. Please try again later." }
    }

    // Return a structured error object
    return {
      error: {
        message: error.message || "Failed to fetch current vote",
        code: error.code,
        details: error.details,
      },
    }
  }
}
