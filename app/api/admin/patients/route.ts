import { NextResponse } from "next/server"
import { headers } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

async function getAuthHeaders() {
    const h = await headers()
    const cookie = h.get("cookie") || ""
    return { "Content-Type": "application/json", cookie }
}

export async function GET() {
    try {
        const backendResponse = await fetch(`${BACKEND_URL}/admin/patients`, {
            method: "GET",
            headers: await getAuthHeaders(),
        })

        if (!backendResponse.ok) {
            throw new Error(`Backend error: ${backendResponse.status}`)
        }

        const data = await backendResponse.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Admin patients GET error:", error)
        return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
    }
}
