import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables")
  throw new Error("Missing Supabase environment variables")
}

// Singleton pattern for client-side Supabase client
let supabaseInstance: SupabaseClient | null = null

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance

  try {
    console.log("Initializing Supabase client with URL:", supabaseUrl)
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: (url, options = {}) => {
          console.log("Supabase fetch request:", { url, options })
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          }).catch(error => {
            console.error("Supabase fetch error:", error)
            throw error
          })
        },
      },
    })
    console.log("Supabase client initialized successfully")
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
    throw error
  }

  return supabaseInstance
}

// For backward compatibility
export const supabase = getSupabase()
