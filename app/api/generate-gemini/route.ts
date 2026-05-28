import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserId } from '@/lib/get-user-id'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const hfUrl = process.env.NEXT_PUBLIC_HF_SPACE_URL
  if (!hfUrl) return NextResponse.json({ error: 'HF_SPACE_URL not configured' }, { status: 500 })

  const body = await req.json()
  let data: Record<string, unknown>
  try {
    const res = await fetch(`${hfUrl}/generate-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-PLAI-Secret': process.env.HF_SPACE_SECRET ?? '' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(280_000),
    })
    const text = await res.text()
    try {
      const parsed = JSON.parse(text)
      // Normalize FastAPI {"detail":"..."} → {"error":"..."}
      data = typeof parsed === 'object' && parsed !== null ? parsed : { error: text.slice(0, 200) }
      if (!data.error && data.detail) data = { error: String(data.detail) }
    } catch {
      data = { error: `HF Space ${res.status}: ${text.slice(0, 200)}` }
    }
    if (!res.ok) return NextResponse.json(data, { status: 502 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Gemini TTS unavailable: ${msg}` }, { status: 502 })
  }

  // Valider que l'audio n'est pas vide
  if (!data.audio_url && !data.audio_data) {
    return NextResponse.json({ error: 'Gemini TTS a retourné un fichier vide. Vérifiez la clé API et la configuration du serveur.' }, { status: 502 })
  }
  if (data.duration_seconds === 0 || data.duration_seconds === '0') {
    return NextResponse.json({ error: 'Audio généré vide (durée 0s). Vérifiez le script et la configuration Gemini.' }, { status: 502 })
  }

  // Save to Supabase (best-effort)
  if (data.audio_url) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      )
      const userId = await getUserId(req)
      await supabase.from('dialogues').insert({
        user_id: userId,
        language: body.locale ?? 'unknown',
        script_text: body.script,
        speakers: body.speakers,
        audio_url: data.audio_url,
        duration_seconds: data.duration_seconds ?? null,
      })
    } catch {
      // non-blocking
    }
  }

  return NextResponse.json(data)
}
