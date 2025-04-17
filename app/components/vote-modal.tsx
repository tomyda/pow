"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/types"

interface VoteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string, reason: string, honorableMentions: string) => void
  selectedUser: User | null
}

const VALUES = [
  "THINK DIFFERENT AND LOOK TO THE HORIZON",
  "LEARN, TEACH, REPEAT",
  "WALK THE TALK",
  "EXECUTE, FAIL FAST, FAIL DIFFERENTLY",
  "WE ENJOY WHAT WE DO",
  "CUSTOMER FIRST"
] as const

export function VoteModal({ isOpen, onClose, onConfirm, selectedUser }: VoteModalProps) {
  const [value, setValue] = useState<string>("")
  const [reason, setReason] = useState("")
  const [honorableMentions, setHonorableMentions] = useState("")

  const handleConfirm = () => {
    onConfirm(value, reason, honorableMentions)
    setValue("")
    setReason("")
    setHonorableMentions("")
  }

  const handleClose = () => {
    setValue("")
    setReason("")
    setHonorableMentions("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="mb-4">
          <DialogTitle>
            You are voting for {selectedUser?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 mb-4">
            <Label htmlFor="reason">Why are you voting for them?</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What made them stand out this week?"
              className="min-h-[100px]"
            />
          </div>

          <div className="grid gap-2 mb-4">
            <Label htmlFor="value">Select a value that best represents their contribution</Label>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select a value" />
              </SelectTrigger>
              <SelectContent>
                {VALUES.map((val) => (
                  <SelectItem key={val} value={val}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 mb-4">
            <Label htmlFor="honorableMentions">Any other honorable mentions?</Label>
            <Textarea
              id="honorableMentions"
              value={honorableMentions}
              onChange={(e) => setHonorableMentions(e.target.value)}
              placeholder="Who else did great work this week?"
              className="min-h-[100px]"
            />
          </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!value || !reason.trim()}>
            Confirm Vote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}