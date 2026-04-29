"use client"

import type React from "react"
import { useState } from "react"

import { Scan, User, ChevronDown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { t } = useLanguage()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const displayName = user?.fullName || user?.username || "User"
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "User"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-border/50 gradient-bg px-4 md:px-6 py-4 md:py-6 min-h-[80px] md:min-h-[100px]">
        <div className="flex items-center justify-between">
          {/* Logo and Welcome Message */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl gradient-primary animate-glow">
                <Scan className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
              </div>
              <span className="text-xl md:text-2xl font-bold gradient-text">{t('mediAI')}</span>
            </div>
            <div className="hidden lg:flex flex-col">
              <h1 className="text-lg md:text-xl font-bold tracking-tight gradient-text">{t('welcome')}</h1>
              <p className="text-sm md:text-base text-muted-foreground">{t('welcomeDesc')}</p>
            </div>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover-lift" aria-label="User profile menu">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full gradient-primary animate-glow">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm md:text-base font-medium text-foreground">{displayName}</span>
                  <span className="text-xs md:text-sm text-muted-foreground">{displayRole}</span>
                </div>
                <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 gradient-card border-border/50">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayRole}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer hover-lift text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-3 md:p-4 lg:p-6 max-w-7xl">
        {children}
      </main>
    </div>
  )
}

