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
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Gemini TTS unavailable: ${msg}` }, { status: 502 })
  }
}
