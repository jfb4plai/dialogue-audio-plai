import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: Request) {
  const hfUrl = process.env.NEXT_PUBLIC_HF_SPACE_URL
  if (!hfUrl) return NextResponse.json({ error: 'HF_SPACE_URL not configured' }, { status: 500 })

  const body = await req.json()
  try {
    const res = await fetch(`${hfUrl}/generate-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-PLAI-Secret': process.env.HF_SPACE_SECRET ?? '' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55_000),
    })
    const text = await res.text()
    let data: Record<string, unknown>
    try {
      const parsed = JSON.parse(text)
      // Normalize FastAPI {"detail":"..."} → {"error":"..."}
      data = typeof parsed === 'object' && parsed !== null ? parsed : { error: text.slice(0, 200) }
      if (!data.error && data.detail) data = { error: String(data.detail) }
    } catch {
      data = { error: `HF Space ${res.status}: ${text.slice(0, 200)}` }
    }
    return NextResponse.json(data, { status: res.ok ? res.status : 502 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Gemini TTS unavailable: ${msg}` }, { status: 502 })
  }
}
