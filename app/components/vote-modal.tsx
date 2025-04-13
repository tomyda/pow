"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { User } from "@/types"

interface VoteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, honorableMentions: string) => void
  selectedUser: User | null
}

export function VoteModal({ isOpen, onClose, onConfirm, selectedUser }: VoteModalProps) {
  const [reason, setReason] = useState("")
  const [honorableMentions, setHonorableMentions] = useState("")

  const handleConfirm = () => {
    onConfirm(reason, honorableMentions)
    setReason("")
    setHonorableMentions("")
  }

  const handleClose = () => {
    setReason("")
    setHonorableMentions("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            You are voting for {selectedUser?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Why are you voting for them?</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What made them stand out this week?"
              className="min-h-[100px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="honorableMentions">Any other honorable mentions?</Label>
            <Textarea
              id="honorableMentions"
              value={honorableMentions}
              onChange={(e) => setHonorableMentions(e.target.value)}
              placeholder="Who else did great work this week?"
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!reason.trim()}>
            Confirm Vote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}