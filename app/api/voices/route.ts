import { NextResponse } from 'next/server'

export async function GET() {
  const hfUrl = process.env.NEXT_PUBLIC_HF_SPACE_URL
  if (!hfUrl) return NextResponse.json({ error: 'HF_SPACE_URL not configured' }, { status: 500 })

  try {
    const res = await fetch(`${hfUrl}/voices`, { next: { revalidate: 3600 } })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Cannot reach TTS server' }, { status: 502 })
  }
}
