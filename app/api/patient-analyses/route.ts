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
    const includeArchived = searchParams.get('include_archived')
    const patientId = searchParams.get('patient_id')

    const queryParams = new URLSearchParams()
    if (includeArchived) queryParams.append('include_archived', includeArchived)
    if (patientId) queryParams.append('patient_id', patientId)

    const queryString = queryParams.toString()
    const url = `${BACKEND_URL}/patient-analyses${queryString ? `?${queryString}` : ''}`

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
    console.error("Patient analyses error:", error)
    return NextResponse.json({ error: "Failed to fetch patient analyses" }, { status: 500 })
  }
}