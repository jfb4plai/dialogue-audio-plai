import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const hfUrl = process.env.NEXT_PUBLIC_HF_SPACE_URL
  if (!hfUrl) return NextResponse.json({ error: 'HF_SPACE_URL not configured' }, { status: 500 })

  const body = await req.json()
  try {
    const res = await fetch(`${hfUrl}/generate-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-PLAI-Secret': process.env.HF_SPACE_SECRET ?? '' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Gemini TTS unavailable' }, { status: 502 })
  }
}
