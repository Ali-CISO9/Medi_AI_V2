import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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