import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function ClosedVotingSession() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    // Redirect to reveal results page
    router.push(`/voting-session/${params.id}/reveal-results`)
  }, [params.id, router])

  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
} 