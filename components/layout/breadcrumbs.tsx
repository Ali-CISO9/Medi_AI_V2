"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeLabels: Record<string, string> = {
  "/": "dashboard",
  "/ai-analysis": "aiAnalysis",
  "/patients": "patients",
  "/chatbot": "chatbot",
  "/reports": "reports",
  "/settings": "settings",
}

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = [{ label: "dashboard", href: "/" }]

  let currentPath = ""
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const label = routeLabels[currentPath] || segment.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    breadcrumbs.push({
      label: label,
      href: currentPath,
    })
  })

  return breadcrumbs
}

interface BreadcrumbsProps {
  className?: string
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <Breadcrumb className={cn("mb-4", className)}>
      <BreadcrumbList className="text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage className="font-medium text-foreground">
                  {t(crumb.label as any)}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Navigate to ${t(crumb.label as any)}`}
                >
                  {index === 0 ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    t(crumb.label as any)
                  )}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}