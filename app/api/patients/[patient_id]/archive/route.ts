import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function PUT(request: Request, { params }: { params: Promise<{ patient_id: string }> }) {
  try {
    const { patient_id } = await params

    // Forward to Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/patients/${patient_id}/archive`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Patients archive error:", error)
    return NextResponse.json({ error: "Failed to archive patient" }, { status: 500 })
  }
}