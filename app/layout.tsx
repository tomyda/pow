import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthButton } from "@/components/auth-button"
import { NavigationMenu, NavigationMenuList, UserNavigation } from "@/components/ui/navigation-menu"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

// Update the metadata in the layout file

export const metadata: Metadata = {
  title: "Horizon - Person of the Week",
  description: "Vote for the Person of the Week at Horizon",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-background">
            <header className="sticky flex justify-center top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-semibold">Horizon - Person of the Week</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <NavigationMenu>
                    <NavigationMenuList>
                      <UserNavigation />
                    </NavigationMenuList>
                  </NavigationMenu>
                  <AuthButton />
                </div>
              </div>
            </header>
            <main>{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'