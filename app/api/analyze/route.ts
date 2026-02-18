import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

async function getAuthHeaders() {
  const h = await headers()
  const cookie = h.get("cookie") || ""
  return { "Content-Type": "application/json", cookie }
}

export async function POST(request: NextRequest) {
  try {
    const jsonData = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(jsonData),
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      let errorMessage = errorText
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.detail || errorData.error || errorText
      } catch {
        // If not JSON, use raw text
      }
      return NextResponse.json({ error: errorMessage }, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("NEXT.JS PROXY ERROR:", error)
    return NextResponse.json({ error: "Failed to analyze data" }, { status: 500 })
  }
}
