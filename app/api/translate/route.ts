import { NextRequest, NextResponse } from 'next/server'

const DEEPL_API_KEY = process.env.DEEPL_API_KEY ?? ''

// DeepL language codes
const DEEPL_CODES: Record<string, string> = {
  nl: 'NL',
  de: 'DE',
  en: 'EN-GB',
  fr: 'FR',
  es: 'ES',
}

async function translateWithDeepL(text: string, targetLang: string): Promise<string> {
  const deepLTarget = DEEPL_CODES[targetLang] ?? targetLang.toUpperCase()
  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: 'FR',
      target_lang: deepLTarget,
    }),
  })
  if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`)
  const data = await res.json()
  const translated = data?.translations?.[0]?.text
  if (!translated) throw new Error('No translation returned')
  return translated
}

export async function POST(req: NextRequest) {
  const { script, targetLang } = await req.json()

  if (!script || !targetLang) {
    return NextResponse.json({ error: 'script et targetLang requis' }, { status: 400 })
  }

  if (!DEEPL_API_KEY) {
    return NextResponse.json({ error: 'Clé DeepL non configurée' }, { status: 500 })
  }

  const lines = script.split('\n')

  const translated = await Promise.all(lines.map(async (line: string) => {
    const match = line.match(/^([A-D]):\s*(.+)$/)
    if (!match) return line

    const label = match[1]
    const text = match[2]

    try {
      const translatedText = await translateWithDeepL(text, targetLang)
      return `${label}: ${translatedText}`
    } catch {
      return line
    }
  }))

  return NextResponse.json({ script: translated.join('\n') })
}
