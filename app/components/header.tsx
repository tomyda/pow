import Link from 'next/link'
import { UserCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto py-4 flex items-center justify-between">
        <h1 className="font-bold text-xl">Your App</h1>
        
        <nav className="flex items-center gap-4">
          {/* Other nav items */}
          
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/path-to-user-image" alt="Profile" />
              <AvatarFallback>
                <UserCircle className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline">Profile</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}