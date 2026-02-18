import { NextResponse } from "next/server"
import { headers } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

async function getAuthHeaders() {
    const h = await headers()
    const cookie = h.get("cookie") || ""
    return { "Content-Type": "application/json", cookie }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ patient_id: string }> }
) {
    try {
        const { patient_id } = await params
        const body = await request.json()

        const backendResponse = await fetch(
            `${BACKEND_URL}/admin/patients/${patient_id}/assign`,
            {
                method: "PUT",
                headers: await getAuthHeaders(),
                body: JSON.stringify(body),
            }
        )

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json()
            return NextResponse.json(
                { error: errorData.detail || "Failed to assign patient" },
                { status: backendResponse.status }
            )
        }

        const data = await backendResponse.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Admin assign patient error:", error)
        return NextResponse.json(
            { error: "Failed to assign patient" },
            { status: 500 }
        )
    }
}
