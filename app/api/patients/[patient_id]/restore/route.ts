import { NextResponse } from "next/server"
import { headers } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

async function getAuthHeaders() {
  const h = await headers()
  const cookie = h.get("cookie") || ""
  return { "Content-Type": "application/json", cookie }
}

export async function PUT(request: Request, { params }: { params: Promise<{ patient_id: string }> }) {
  try {
    const { patient_id } = await params

    const backendResponse = await fetch(`${BACKEND_URL}/patients/${patient_id}/restore`, {
      method: "PUT",
      headers: await getAuthHeaders(),
    })

    if (!backendResponse.ok) {
      if (backendResponse.status === 400) {
        const errorData = await backendResponse.json()
        if (errorData.detail && errorData.detail.includes("already active")) {
          return NextResponse.json({ success: true, message: "Patient is already active" })
        }
      }
      throw new Error(`Backend error: ${backendResponse.status}`)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Patients restore error:", error)
    return NextResponse.json({ error: "Failed to restore patient" }, { status: 500 })
  }
}