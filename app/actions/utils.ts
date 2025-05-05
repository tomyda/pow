import { SupabaseClient } from "@supabase/supabase-js"
import { createActionSupabaseClient } from "@/lib/supabase-actions"
import { ApiError } from "./types"
import { ApiResponse } from "./types"

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

// Test function to verify Supabase client setup
export async function testSupabaseSetup(): Promise<ApiResponse<{hasUser: boolean, hasDbAccess: boolean}>> {
  try {
    const supabase = await createActionSupabaseClient()

    // Try to get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new ApiError(authError.message) }
    }

    // Try a simple database query
    const { data: testData, error: queryError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (queryError) {
      return { error: new ApiError(queryError.message) }
    }

    return {
      data: {
        hasUser: !!user,
        hasDbAccess: !!testData
      }
    }
  } catch (error) {
    return {
      error: new ApiError(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }
}
