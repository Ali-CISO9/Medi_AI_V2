import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    // Transparent proxy: forward JSON directly to backend
    const jsonData = await request.json()

    // Forward the request to the Python backend as JSON
    const backendResponse = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })

    // Forward exact backend response (including error status codes)
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
