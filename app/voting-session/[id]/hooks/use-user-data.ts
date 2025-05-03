import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { users } from "@/app/actions/index"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/types"
import { AuthSession } from '@supabase/supabase-js'

const getUsers = users.getUsers

export function useUserData() {
  const [usersList, setUsersList] = useState<User[]>([])
  const [authSession, setAuthSession] = useState<AuthSession | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = getSupabase()

  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true)
        
        // Fetch all users
        const { data: usersData, error: usersError } = await getUsers()
        if (usersError) {
          toast({
            title: "Error",
            description: usersError.message,
            variant: "destructive",
          })
          return
        }
        setUsersList(usersData || [])

        // Check if user is authenticated
        const { data: { session: authSession } } = await supabase.auth.getSession()
        if (!authSession) {
          throw new Error("Not authenticated")
        }
        setAuthSession(authSession)

        // Get user details to check admin status
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', authSession.user.id)
          .single()

        if (userError) throw userError
        setIsAdmin(userData?.is_admin || false)
      } catch (err) {
        console.error("Error fetching user data:", err)
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch user data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  return { usersList, authSession, isAdmin, isLoading }
} 