import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { sessions } from "@/app/actions/index"
import { getCurrentWeekAndYear } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface SessionManagerProps {
  onSessionCreated?: (session: any) => void
  hasOpenSession: boolean
}

interface SupabaseError {
  message: string
  code?: string
  details?: string
}

const createVotingSession = sessions.createVotingSession

export function SessionManager({ onSessionCreated, hasOpenSession }: SessionManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [weekNumber, setWeekNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const currentWeek = getCurrentWeekAndYear()

  const handleCreateSession = async () => {
    try {
      setLoading(true)
      const weekNum = parseInt(weekNumber || currentWeek.weekNumber.toString())

      const { data, error } = await createVotingSession(weekNum)
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }
      if (data) {
        onSessionCreated?.(data)
      }

      toast({
        title: "Success",
        description: "Voting session created successfully",
      })
      setIsCreateDialogOpen(false)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create session",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button disabled={hasOpenSession}>Create New Session</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Voting Session</DialogTitle>
          <DialogDescription>
            Create a new voting session for a specific week. Leave fields empty to use current week.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="week" className="text-right">
              Week
            </Label>
            <Input
              id="week"
              placeholder={currentWeek.weekNumber.toString()}
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateSession} disabled={loading}>
            {loading ? "Creating..." : "Create Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}