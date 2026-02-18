import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

/**
 * Fetches from the backend API with credentials and CSRF token.
 * Automatically redirects to /login on 401 responses.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers)

  // Read CSRF token cookie and attach as header for state-changing requests
  const method = (options.method || "GET").toUpperCase()
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const csrfToken = document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrf_token="))
      ?.split("=")[1]
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken)
    }
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  })

  // Auto-redirect on 401
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login"
  }

  return res
}
