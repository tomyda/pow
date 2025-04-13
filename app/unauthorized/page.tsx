import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function Unauthorized() {
  return (
    <div className="container mx-auto py-16 flex flex-col items-center justify-center">
      <Alert variant="destructive" className="max-w-md mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          Only users with @usehorizon.ai email addresses are allowed to access this application.
        </AlertDescription>
      </Alert>

      <p className="mb-6 text-center text-muted-foreground">
        If you have a valid @usehorizon.ai email address, please sign in with that account.
      </p>

      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  )
}
