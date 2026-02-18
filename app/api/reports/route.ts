import { NextRequest } from 'next/server';
import { headers } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function getAuthHeaders() {
    const h = await headers()
    const cookie = h.get("cookie") || ""
    return { "Content-Type": "application/json", cookie }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const response = await fetch(`${BACKEND_URL}/reports`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json();
            return Response.json(errorData, { status: response.status });
        }
        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        console.error('Error in /api/reports:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}