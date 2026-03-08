"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Scan,
  MessageSquare,
  Settings,
  Menu,
  X,
  Home,
  FileText,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "AI Analysis",
    url: "/ai-analysis",
    icon: Scan,
  },
  {
    title: "Patients",
    url: "/patients",
    icon: Users,
  },
  {
    title: "Chatbot",
    url: "/chatbot",
    icon: MessageSquare,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function MobileNav() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const handleNavigation = (url: string) => {
    router.push(url)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover-lift"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 gradient-card border-r border-border/50 p-0">
        <SheetHeader className="border-b border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
              <Scan className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="text-lg font-bold gradient-text text-left">
                {t('mediAI')}
              </SheetTitle>
              <span className="text-xs text-muted-foreground">{t('medicalAI' as any)}</span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-4">
          <nav className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {t('navigation' as any)}
            </h3>
            {navigationItems.map((item) => (
              <Button
                key={item.title}
                variant={pathname === item.url ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                  "hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent/30 hover:text-accent-foreground",
                  pathname === item.url && "bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-sm"
                )}
                onClick={() => handleNavigation(item.url)}
                aria-label={`${t('navigateTo' as any)} ${item.title}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t(item.title.toLowerCase().replace(' ', '') as any)}</span>
              </Button>
            ))}
          </nav>
        </div>

        <div className="border-t border-border/50 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="User avatar" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                DA
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate">Dr. Ahmed</span>
              <span className="text-xs text-muted-foreground truncate">{t('radiologist')}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function MobileHeader() {
  const { t } = useLanguage()

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
          <Scan className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold gradient-text">{t('mediAI')}</span>
      </div>
      <MobileNav />
    </header>
  )
}