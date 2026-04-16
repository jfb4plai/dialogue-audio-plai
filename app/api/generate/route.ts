import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const hfUrl = process.env.NEXT_PUBLIC_HF_SPACE_URL

  if (!hfUrl) {
    return NextResponse.json({ error: 'HF_SPACE_URL not configured' }, { status: 500 })
  }

  // Forward to HF Space
  let result: Record<string, unknown>
  try {
    const hfRes = await fetch(`${hfUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: body.script,
        speakers: body.speakers.map((s: { label: string; voice: string }) => ({
          label: s.label,
          voice: s.voice,
        })),
        silence_ms: body.silence_ms ?? 500,
        item_title: body.item_title ?? 'Dialogue audio',
      }),
      signal: AbortSignal.timeout(180_000),
    })

    if (!hfRes.ok) {
      const err = await hfRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: err.detail || 'TTS generation failed' },
        { status: hfRes.status }
      )
    }

    result = await hfRes.json()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'TTS server unreachable'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Save to Supabase (best-effort, don't fail the request if this errors)
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    const langCode = body.speakers?.[0]?.voice?.split('-')[0] ?? 'unknown'
    await supabase.from('dialogues').insert({
      language: langCode,
      script_text: body.script,
      speakers: body.speakers,
      audio_url: result.audio_url,
      duration_seconds: result.duration_seconds,
    })
  } catch {
    // non-blocking
  }

  return NextResponse.json(result)
}
