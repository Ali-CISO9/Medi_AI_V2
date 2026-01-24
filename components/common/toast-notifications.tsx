"use client"

import * as React from "react"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ToastVariant = "success" | "error" | "warning" | "info"

interface ToastOptions {
  title?: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    className: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  },
  error: {
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  },
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  },
}

export function showToast(variant: ToastVariant, message: string, options?: ToastOptions) {
  const config = toastConfig[variant]
  const Icon = config.icon

  return toast(message, {
    description: options?.description,
    duration: options?.duration ?? 4000,
    className: cn(
      "gradient-card border border-border/50 shadow-lg",
      config.className
    ),
    icon: <Icon className="h-5 w-5 shrink-0" />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  })
}

// Convenience functions for different toast types
export const toastSuccess = (message: string, options?: ToastOptions) =>
  showToast("success", message, options)

export const toastError = (message: string, options?: ToastOptions) =>
  showToast("error", message, options)

export const toastWarning = (message: string, options?: ToastOptions) =>
  showToast("warning", message, options)

export const toastInfo = (message: string, options?: ToastOptions) =>
  showToast("info", message, options)

// Hook for managing toast notifications
export function useToastNotifications() {
  return {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
    show: showToast,
  }
}

// Custom toast component for more complex notifications
interface CustomToastProps {
  variant: ToastVariant
  title: string
  description?: string
  onClose?: () => void
  className?: string
}

export function CustomToast({ variant, title, description, onClose, className }: CustomToastProps) {
  const config = toastConfig[variant]
  const Icon = config.icon

  return (
    <div className={cn(
      "relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-200",
      config.className,
      className
    )}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        {description && (
          <p className="text-sm opacity-90 mt-1">{description}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  )
}

// Loading toast for async operations
export function showLoadingToast(message: string) {
  return toast.loading(message, {
    className: "gradient-card border border-border/50",
  })
}

// Update loading toast to success/error
export function updateToast(toastId: string | number, variant: ToastVariant, message: string, options?: ToastOptions) {
  const config = toastConfig[variant]
  const Icon = config.icon

  toast.success(message, {
    id: toastId,
    description: options?.description,
    duration: options?.duration ?? 4000,
    className: cn(
      "gradient-card border border-border/50 shadow-lg",
      config.className
    ),
    icon: <Icon className="h-5 w-5 shrink-0" />,
  })
}