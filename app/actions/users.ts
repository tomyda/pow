"use server"

import { createActionSupabaseClient } from "@/lib/supabase-actions"
import { ApiResponse } from "./types"
import type { User } from "@/types"
import { handleSupabaseError } from "./utils"

// Get all users with their latest win information
export async function getUsers(): Promise<ApiResponse<User[]>> {
  try {
    const supabase = await createActionSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')

    if (error) {
      return { error: handleSupabaseError(error) }
    }

    return { data: data as User[] }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}
