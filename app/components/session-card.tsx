import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Trophy } from "lucide-react"

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
}

export function SessionCard({ id, weekNumber, status, createdAt, winner, voters = [], total_votes = 0 }: SessionCardProps) {
  const router = useRouter()
  const formattedDate = new Date(createdAt).toLocaleDateString()

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => router.push(`/voting-session/${id}`)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Week {weekNumber}</CardTitle>
            <CardDescription>Created on {formattedDate}</CardDescription>
            {total_votes > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {total_votes} vote{total_votes !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Badge variant={status === "OPEN" ? "default" : "secondary"}>
            {status}
          </Badge>
        </div>

        {status === "CLOSED" && winner && (
          <div className="mt-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={winner.avatar_url} alt={winner.name} />
                <AvatarFallback>{winner.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{winner.name}</span>
            </div>
          </div>
        )}

        {voters && voters.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Voters:</p>
            <div className="flex -space-x-2">
              {voters.map((voter) => (
                <Avatar key={voter.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={voter.avatar_url} alt={voter.name} />
                  <AvatarFallback>{voter.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
    </Card>
  )
}