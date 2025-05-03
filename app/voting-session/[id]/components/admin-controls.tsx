import { Button } from "@/components/ui/button"
import { Loader2, Lock } from "lucide-react"

interface AdminControlsProps {
  isAdmin: boolean
  isClosing: boolean
  onCloseSession: () => Promise<void>
}

export function AdminControls({ isAdmin, isClosing, onCloseSession }: AdminControlsProps) {
  if (!isAdmin) return null
  
  return (
    <Button
      variant="destructive"
      onClick={onCloseSession}
      disabled={isClosing}
      className="flex items-center gap-2"
    >
      {isClosing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Closing...
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" />
          Close Session
        </>
      )}
    </Button>
  )
} 