"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export interface UserPermissions {
  can_view_dashboard: boolean
  can_run_analysis: boolean
  can_use_chatbot: boolean
  can_view_reports: boolean
  can_view_patients: boolean
  can_create_patients: boolean
  can_edit_patients: boolean
  can_delete_patients: boolean
  can_view_records: boolean
  can_manage_users: boolean
  can_view_audit_logs: boolean
  can_access_admin: boolean
}

export interface AuthUser {
  id: number
  username: string
  email: string
  fullName: string
  role: string
  permissions: UserPermissions
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (perm: keyof UserPermissions) => boolean
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

// ─────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch current user from /auth/me (cookie is sent automatically)
  const refreshUser = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        credentials: "include",
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // On mount, try to restore session
  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Login
  const login = useCallback(
    async (username: string, password: string) => {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }))
        throw new Error(err.detail || "Login failed")
      }

      const data = await res.json()

      // 1. Save marker to storage BEFORE state update
      localStorage.setItem("user_session_active", "true")

      // 2. Force hard redirect to clear memory/state - ATOMIC NAVIGATION (No setUser)
      const isAdmin = data.user?.permissions?.can_access_admin
      window.location.href = isAdmin ? "/admin" : "/"
    },
    [],
  )

  // Logout
  const logout = useCallback(async () => {
    // 1. Clear storage immediately
    localStorage.removeItem("user_session_active")

    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // silently ignore logout failures
    }

    // 2. Force hard refresh to login - ATOMIC NAVIGATION (No setUser)
    window.location.href = "/login"
  }, [])

  // Permission check
  const hasPermission = useCallback(
    (perm: keyof UserPermissions): boolean => {
      if (!user) return false
      return !!user.permissions?.[perm]
    },
    [user],
  )

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
