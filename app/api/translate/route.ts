import { NextRequest, NextResponse } from 'next/server'

async function translateWithMyMemory(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const langpair = `${sourceLang}|${targetLang}`
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)
  const data = await res.json()
  const translated = data?.responseData?.translatedText
  if (!translated || translated === text) throw new Error('No translation')
  return translated
}

export async function POST(req: NextRequest) {
  const { script, sourceLang, targetLang } = await req.json()

  if (!script || !targetLang) {
    return NextResponse.json({ error: 'script et targetLang requis' }, { status: 400 })
  }

  const lines = script.split('\n')
  const src = sourceLang ?? 'fr'

  const translated = await Promise.all(lines.map(async (line: string) => {
    const match = line.match(/^([A-D]):\s*(.+)$/)
    if (!match) return line

    const label = match[1]
    const text = match[2]

    try {
      const translatedText = await translateWithMyMemory(text, src, targetLang)
      return `${label}: ${translatedText}`
    } catch {
      return line // fallback: keep original
    }
  }))

  return NextResponse.json({ script: translated.join('\n') })
}
