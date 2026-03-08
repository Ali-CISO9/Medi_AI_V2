"use client"

import React, { useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
    children: React.ReactNode
    /** Optional: redirect to login automatically (default true) */
    redirectToLogin?: boolean
}

/**
 * Wrapper component that protects routes:
 * - Shows spinner while auth state is loading
 * - Redirects to /login if no user session
 * - Renders children once authenticated
 */
export function AuthGuard({ children, redirectToLogin = true }: AuthGuardProps) {
    const { user, isLoading } = useAuth()
    console.log("[GUARD] isLoading:", isLoading, "user:", !!user)
    const redirecting = useRef(false)

    useEffect(() => {
        if (!isLoading && !user && redirectToLogin && !redirecting.current) {
            redirecting.current = true
            window.location.href = "/login"
        }
    }, [isLoading, user, redirectToLogin])



    if (isLoading || (!user && redirectToLogin)) {
        return (
            <div className="flex h-screen w-full items-center justify-center gradient-bg">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium">Loading session...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}

