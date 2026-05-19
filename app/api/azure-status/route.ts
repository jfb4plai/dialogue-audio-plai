import { NextResponse } from 'next/server'

export async function GET() {
  const hfUrl = process.env.NEXT_PUBLIC_HF_SPACE_URL
  if (!hfUrl) return NextResponse.json({ configured: false })

  try {
    const res = await fetch(`${hfUrl}/azure-status`, { next: { revalidate: 60 } })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ configured: false })
  }
}
