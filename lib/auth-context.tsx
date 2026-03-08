"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"

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
  const setIsLoadingDebug = (val: boolean, source: string) => {
    console.log(`[AUTH] setIsLoading(${val}) called from: ${source}`)
    setIsLoading(val)
  }

  // Fetch current user from /auth/me (cookie is sent automatically)
  const refreshUser = useCallback(async () => {
    console.log("[AUTH] refreshUser called, hasInitialized:", hasInitialized.current)
    setIsLoadingDebug(true, "refreshUser-start")
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        credentials: "include",
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.status === 401) {
        setUser(null)
        return
      }

      if (!res.ok) throw new Error("Failed to fetch user")

      const data = await res.json()
      setUser(data)
    } catch (err) {
      console.error("refreshUser error:", err)
      setUser(null)
    } finally {
      setIsLoadingDebug(false, "refreshUser-finally")
    }
  }, [])

  // On mount, try to restore session
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      // 1. Save marker to storage BEFORE navigation
      localStorage.setItem("user_session_active", "true")

      // 2. ATOMIC NAVIGATION: No setUser() call - just redirect
      // The hard reload will force the App to re-mount and read from storage
      const isAdmin = data.user?.permissions?.can_access_admin
      window.location.href = isAdmin ? "/admin" : "/"
    },
    [],
  )

  // Logout
  const logout = useCallback(async () => {
    // 1. Clear storage immediately - SYNCHRONOUS
    localStorage.removeItem("user_session_active")

    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (err) {
      console.error("logout error:", err)
    } finally {
      // 2. ATOMIC NAVIGATION: No setUser(null) - just redirect
      window.location.href = "/login"
    }
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
