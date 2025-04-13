import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SessionCardProps {
  id: number
  weekNumber: number
  status: string
  createdAt: string
}

export function SessionCard({ id, weekNumber, status, createdAt }: SessionCardProps) {
  const router = useRouter()
  const formattedDate = new Date(createdAt).toLocaleDateString()

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => router.push(`/session/${id}`)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Week {weekNumber}</CardTitle>
            <CardDescription>Created on {formattedDate}</CardDescription>
          </div>
          <Badge variant={status === "OPEN" ? "default" : "secondary"}>
            {status}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  )
}