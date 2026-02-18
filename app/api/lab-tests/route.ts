import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

async function getAuthHeaders() {
  const h = await headers()
  const cookie = h.get("cookie") || ""
  return { "Content-Type": "application/json", cookie }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    const backendResponse = await fetch(`${BACKEND_URL}/lab-tests?patientId=${patientId}`, {
      method: "GET",
      headers: await getAuthHeaders(),
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Lab tests error:", error)
    return NextResponse.json({ error: "Failed to fetch lab tests" }, { status: 500 })
  }
}
