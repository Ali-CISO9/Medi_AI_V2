import { NextResponse } from "next/server"
import { headers } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

async function getAuthHeaders() {
  const h = await headers()
  const cookie = h.get("cookie") || ""
  return { "Content-Type": "application/json", cookie }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const patientId = searchParams.get('patient_id')

    let url = `${BACKEND_URL}/patients?status=${status}`
    if (patientId) url += `&patient_id=${patientId}`

    const backendResponse = await fetch(url, {
      method: "GET",
      headers: await getAuthHeaders(),
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Patients GET error:", error)
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/patients`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json({ error: data.detail || "Failed to process patient data" }, { status: backendResponse.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Patients error:", error)
    return NextResponse.json({ error: "Failed to process patient data" }, { status: 500 })
  }
}