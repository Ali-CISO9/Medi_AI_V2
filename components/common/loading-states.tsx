"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

interface LoadingStatesProps {
  className?: string
  variant?: "skeleton" | "spinner" | "card"
  size?: "sm" | "md" | "lg"
}

export function LoadingSkeleton({ className, size = "md" }: Omit<LoadingStatesProps, "variant">) {
  const height = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8",
  }[size]

  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className={cn("w-full", height)} />
      <Skeleton className={cn("w-3/4", height)} />
      <Skeleton className={cn("w-1/2", height)} />
    </div>
  )
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("gradient-card p-6 rounded-xl border border-border/50", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    </div>
  )
}

export function LoadingTable({ className, rows = 5 }: { className?: string; rows?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 gradient-card rounded-lg border border-border/50">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoadingSpinner({ className, size = "md" }: Omit<LoadingStatesProps, "variant">) {
  const spinnerSize = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }[size]

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <Spinner className={spinnerSize} />
    </div>
  )
}

export function LoadingStates({ variant = "skeleton", ...props }: LoadingStatesProps) {
  switch (variant) {
    case "spinner":
      return <LoadingSpinner {...props} />
    case "card":
      return <LoadingCard className={props.className} />
    default:
      return <LoadingSkeleton {...props} />
  }
}

// Page-level loading component
export function PageLoading({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <LoadingSpinner size="lg" />
      {message && (
        <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
      )}
    </div>
  )
}

// Inline loading component for buttons/forms
export function InlineLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Spinner className="h-4 w-4" />
      <span className="text-sm">Loading...</span>
    </div>
  )
}