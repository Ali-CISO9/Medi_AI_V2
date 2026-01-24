"use client"

import * as React from "react"
import { AlertTriangle, Trash2, LogOut, Archive } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ConfirmationType = "delete" | "logout" | "archive" | "custom"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
  type?: ConfirmationType
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  loading?: boolean
  className?: string
}

const confirmationConfig = {
  delete: {
    icon: Trash2,
    title: "Delete Item",
    description: "This action cannot be undone. This will permanently delete the selected item.",
    confirmText: "Delete",
    variant: "destructive" as const,
  },
  logout: {
    icon: LogOut,
    title: "Sign Out",
    description: "Are you sure you want to sign out of your account?",
    confirmText: "Sign Out",
    variant: "default" as const,
  },
  archive: {
    icon: Archive,
    title: "Archive Item",
    description: "This item will be moved to archive. You can restore it later.",
    confirmText: "Archive",
    variant: "default" as const,
  },
  custom: {
    icon: AlertTriangle,
    title: "Confirm Action",
    description: "Are you sure you want to proceed with this action?",
    confirmText: "Confirm",
    variant: "default" as const,
  },
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  type = "custom",
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  variant,
  loading = false,
  className,
}: ConfirmationDialogProps) {
  const config = confirmationConfig[type]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("gradient-card border border-border/50 sm:max-w-[425px]", className)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              variant === "destructive" || config.variant === "destructive"
                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-primary/10 text-primary"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">
                {title || config.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-left pl-13">
          {description || config.description}
        </DialogDescription>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="hover-lift"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" || config.variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className="hover-lift"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </div>
            ) : (
              confirmText || config.confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing confirmation dialogs
export function useConfirmationDialog() {
  const [open, setOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Partial<ConfirmationDialogProps>>({})

  const confirm = React.useCallback((options: Omit<ConfirmationDialogProps, "open" | "onOpenChange">) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...options,
        onConfirm: () => {
          resolve(true)
          setOpen(false)
        },
        onCancel: () => {
          resolve(false)
          setOpen(false)
        },
      })
      setOpen(true)
    })
  }, [])

  const ConfirmationDialogComponent = React.useMemo(() => (
    <ConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      onConfirm={() => {}}
      {...config}
    />
  ), [open, config])

  return {
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent,
  }
}

// Convenience functions for common confirmations
export const confirmDelete = (options?: { title?: string; description?: string }) =>
  new Promise<boolean>((resolve) => {
    // This would typically use a global confirmation dialog instance
    resolve(window.confirm(options?.title || "Are you sure you want to delete this item?"))
  })

export const confirmLogout = (options?: { title?: string; description?: string }) =>
  new Promise<boolean>((resolve) => {
    resolve(window.confirm(options?.title || "Are you sure you want to sign out?"))
  })