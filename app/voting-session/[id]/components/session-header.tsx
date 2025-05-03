import Link from "next/link"
import { AdminControls } from "./admin-controls"

interface SessionHeaderProps {
  title: string
  weekNumber: number
  isAdmin: boolean
  isClosing: boolean
  onCloseSession: () => Promise<void>
}

export function SessionHeader({ 
  title, 
  weekNumber, 
  isAdmin, 
  isClosing, 
  onCloseSession 
}: SessionHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back to Sessions
        </Link>
        <AdminControls 
          isAdmin={isAdmin} 
          isClosing={isClosing} 
          onCloseSession={onCloseSession} 
        />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground">
          Week {weekNumber}
        </p>
      </div>
    </>
  )
} 