import { SupabaseClient } from "@supabase/supabase-js"
import { createActionSupabaseClient } from "@/lib/supabase-server"
import { ApiError } from "./types"

// Helper function to safely make Supabase requests with rate limiting
export async function safeSupabaseRequest<T>(
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

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): ApiError {
  if (error instanceof Error) {
    return new ApiError(error.message)
  }
  return new ApiError("An unknown error occurred")
}

// Helper function to create user map
export function createUserMap(users: any[]): Record<string, any> {
  return (users || []).reduce((acc: Record<string, any>, user: any) => {
    acc[user.id] = user
    return acc
  }, {} as Record<string, any>)
}
