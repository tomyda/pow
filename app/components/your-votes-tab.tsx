"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { votes as votesActions } from "@/app/actions/index"
import type { User } from "@/types"
import type { VoteWithUsers } from "@/app/actions/types"

interface UserVote extends VoteWithUsers {
  session_week: number
}

interface YourVotesTabProps {
  userId: string
}

export function YourVotesTab({ userId }: YourVotesTabProps) {
  const [votes, setVotes] = useState<UserVote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await votesActions.getUserVotes(userId)
      if (data) setVotes(data as UserVote[])
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (votes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        You haven&apos;t cast any votes yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {votes.map((vote) => (
        <Card key={vote.id} className="hover:bg-accent/30 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={vote.votee?.avatar_url} alt={vote.votee?.name} />
                  <AvatarFallback>{vote.votee?.name?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{vote.votee?.name ?? "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    Week {vote.session_week}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(vote.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {vote.value && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                {vote.value}
              </Badge>
            )}
            {vote.reason && (
              <p className="text-sm text-muted-foreground">{vote.reason}</p>
            )}
            {vote.honorable_mentions && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Honorable Mentions</p>
                <p className="text-sm text-muted-foreground">{vote.honorable_mentions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
