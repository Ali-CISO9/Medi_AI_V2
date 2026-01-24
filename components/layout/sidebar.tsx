"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Scan,
  MessageSquare,
  Settings,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navigationItems = [
  {
    title: "dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "aiAnalysis",
    url: "/ai-analysis",
    icon: Scan,
  },
  {
    title: "patients",
    url: "/patients",
    icon: Users,
  },
  {
    title: "chatbot",
    url: "/chatbot",
    icon: MessageSquare,
  },
  {
    title: "reports",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "settings",
    url: "/settings",
    icon: Settings,
  },
]

function AppSidebar() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <SidebarPrimitive variant="inset" className="gradient-card border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
            <Scan className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold gradient-text truncate">{t('mediAI')}</span>
            <span className="text-xs text-muted-foreground truncate">{t('medicalAI' as any)}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('navigation' as any)}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent/30 transition-all duration-200"
                    tooltip={t(item.title as any)}
                  >
                    <button
                      onClick={() => router.push(item.url)}
                      className="flex items-center gap-3 w-full text-left"
                      aria-label={`${t('navigateTo' as any)} ${t(item.title as any)}`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t(item.title as any)}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
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
      </SidebarFooter>
      <SidebarRail />
    </SidebarPrimitive>
  )
}

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger className="-ml-1 hover-lift" />
          <div className="flex items-center gap-2 ml-auto">
            {/* Additional header content can go here */}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}