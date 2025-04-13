"use client"

import { useState } from "react"
import Image from "next/image"
import type { User } from "@/types"
import { formatRelativeTime } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface UserCardProps {
  user: User
  isSelected: boolean
  hasVoted: boolean
  onVote: (userId: string) => void
}

export function UserCard({ user, isSelected, hasVoted, onVote }: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${isHovered && !hasVoted ? "shadow-md scale-[1.02]" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0 relative">
        {isSelected && (
          <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
            <CheckCircle size={20} />
          </div>
        )}
        <div className="relative h-48 w-full bg-muted">
          <Image
            src={user.avatar_url || "/placeholder.svg?height=200&width=200"}
            alt={user.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">Last win: {formatRelativeTime(user.last_win)}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => onVote(user.id)}
          disabled={hasVoted && !isSelected}
          variant={isSelected ? "default" : "outline"}
          className="w-full"
        >
          {isSelected ? "Selected" : hasVoted ? "Vote (Already Voted)" : "Vote"}
        </Button>
      </CardFooter>
    </Card>
  )
}
