"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabase()

  const runTest = async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      // Try a simple database query
      const { data: testData, error: queryError } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      if (queryError) {
        throw queryError
      }

      setResult({
        success: true,
        data: {
          hasUser: !!user,
          hasDbAccess: !!testData
        }
      })
    } catch (err) {
      console.error('Test error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Client Test</h1>

      <Button
        onClick={runTest}
        disabled={loading}
        className="mb-4"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Testing...
          </>
        ) : (
          'Run Test'
        )}
      </Button>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && !error && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">Test Results:</p>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}