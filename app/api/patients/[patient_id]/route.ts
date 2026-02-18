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
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/patients/${patient_id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Patients PUT error:", error)
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ patient_id: string }> }) {
  try {
    const { patient_id } = await params
    const backendResponse = await fetch(`${BACKEND_URL}/patients/${patient_id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Patients DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 })
  }
}