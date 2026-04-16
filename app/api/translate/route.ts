import { NextRequest, NextResponse } from 'next/server'

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL ?? 'https://translate.argosopentech.com'

export async function POST(req: NextRequest) {
  const { script, sourceLang, targetLang } = await req.json()

  if (!script || !targetLang) {
    return NextResponse.json({ error: 'script et targetLang requis' }, { status: 400 })
  }

  // Translate only the text part after each "X:" label
  const lines = script.split('\n')

  const translated = await Promise.all(lines.map(async (line: string) => {
    const match = line.match(/^([A-D]):\s*(.+)$/)
    if (!match) return line

    const label = match[1]
    const text = match[2]

    try {
      const res = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLang ?? 'fr',
          target: targetLang,
          format: 'text',
        }),
      })
      const data = await res.json()
      return `${label}: ${data.translatedText ?? text}`
    } catch {
      return line // fallback: keep original
    }
  }))

  return NextResponse.json({ script: translated.join('\n') })
}
