"use client"

import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useSessionData } from "./hooks/use-session-data"
import { ClosedVotingSession } from "./components/closed-session"
import { OpenVotingSession } from "./components/open-session"

export default function VotingSessionPage() {
  const params = useParams()
  const { votingSession, loading, error } = useSessionData(params.id as string)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!votingSession) {
    return <div>Session not found</div>
  }

  if (votingSession.status === 'CLOSED') {
    return <ClosedVotingSession />
  }

  return <OpenVotingSession votingSession={votingSession} />
}