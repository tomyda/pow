import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Lock, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { sessions } from "@/app/actions/index"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  avatar_url: string
  email?: string
}

interface SessionCardProps {
  id: number
  weekNumber: number
  status: string
  createdAt: string
  winner?: User | null
  voters?: User[]
  total_votes?: number
  isAdmin?: boolean
  onSessionClosed?: () => void
}

const closeVotingSession = sessions.closeVotingSession

export function SessionCard({
  id,
  weekNumber,
  status,
  createdAt,
  winner,
  voters = [],
  total_votes = 0,
  isAdmin = false,
  onSessionClosed
}: SessionCardProps) {
  const router = useRouter()
  const formattedDate = new Date(createdAt).toDateString()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleCloseSession = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click navigation
    try {
      setLoading(true)
      const { data, error } = await closeVotingSession(id)

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (data !== undefined) {
        onSessionClosed?.()
      }

      toast({
        title: "Success",
        description: "Voting session closed successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to close session",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isOpen = status === "OPEN"

  return (
    <Card
      className={`cursor-pointer hover:bg-accent/50 transition-colors ${
        isOpen ? 'border-green-500 bg-green-50/10' : 'border-gray-200 bg-gray-50/10'
      }`}
      onClick={() => router.push(`/voting-session/${id}`)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <CardTitle>Week {weekNumber}</CardTitle>
            <CardDescription>Created on {formattedDate}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className={`flex items-center gap-1 ${
                isOpen ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              {isOpen ? <Timer className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {status}
            </Badge>
            {isAdmin && isOpen && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCloseSession}
                disabled={loading}
                className="mt-2"
              >
                {loading ? "Closing..." : "Close Session"}
              </Button>
            )}
          </div>
        </div>

        {status === "CLOSED" && winner && (
          <div className="mt-6 flex items-center gap-2 bg-yellow-50/20 p-4 rounded-lg border border-yellow-200">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div className="flex items-center gap-2">
              <Avatar className="h-20 w-20">
                <AvatarImage  src={winner.avatar_url} alt={winner.name} />
                <AvatarFallback>{winner.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm font-medium">{winner.name}</span>
                <p className="text-xs text-muted-foreground">Winner</p>
              </div>
            </div>
          </div>
        )}

        {voters && voters.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {total_votes > 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                {total_votes} vote{total_votes !== 1 ? 's' : ''}
              </p>
            ) : "No votes yet"}
            <div className="flex -space-x-2">
              {voters.map((voter) => (
                <Avatar key={voter.id} className="h-12 w-12 border-2 border-background">
                  <AvatarImage src={voter.avatar_url} alt={voter.name} />
                  <AvatarFallback className="text-lg">{voter.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
    </Card>
  )
}