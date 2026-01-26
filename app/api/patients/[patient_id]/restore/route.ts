import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function PUT(request: Request, { params }: { params: Promise<{ patient_id: string }> }) {
  try {
    const { patient_id } = await params

    // Forward to Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/patients/${patient_id}/restore`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!backendResponse.ok) {
      // For restore, 400 might mean patient is already active, which is fine
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