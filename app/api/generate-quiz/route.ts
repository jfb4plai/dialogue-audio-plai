import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const rateMap = new Map<string, { count: number; resetAt: number }>()
const MAX_PER_HOUR = 20
const HOUR_MS = 60 * 60 * 1000

const LOCALE_LABELS: Record<string, string> = {
  nl_BE: 'néerlandais',
  nl_NL: 'néerlandais',
  fr_FR: 'français',
  fr_BE: 'français',
  de_DE: 'allemand',
  en_GB: 'anglais',
  es_ES: 'espagnol',
  it_IT: 'italien',
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_PER_HOUR) {
      return NextResponse.json({ error: 'Limite atteinte : 20 générations par heure.' }, { status: 429 })
    }
    entry.count++
  } else {
    rateMap.set(ip, { count: 1, resetAt: now + HOUR_MS })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Clé API non configurée.' }, { status: 500 })
  }

  const { script, locale = 'nl_BE' } = await req.json()
  if (!script?.trim()) {
    return NextResponse.json({ error: 'Script manquant.' }, { status: 400 })
  }

  const langue = LOCALE_LABELS[locale] ?? 'la langue du dialogue'

  const systemPrompt = `Tu es un assistant pédagogique. Tu génères des questions de compréhension Vrai/Faux à partir de dialogues audio pour des apprenants en langue étrangère.`

  const userPrompt = `À partir de ce dialogue en ${langue}, génère exactement 5 questions de compréhension de type Vrai/Faux.

DIALOGUE :
${script}

RÈGLES :
- Les questions portent sur des faits précis du dialogue (pas d'interprétation)
- Chaque question est formulée en français (langue de l'enseignant)
- Réponse : Vrai ou Faux
- Justification : courte phrase citant ou paraphrasant le dialogue

FORMAT DE RÉPONSE — JSON strict, rien d'autre :
[
  {"question": "...", "answer": "Vrai", "justification": "..."},
  {"question": "...", "answer": "Faux", "justification": "..."}
]`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })
    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: 'Format invalide. Réessayez.' }, { status: 500 })
    const questions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ questions })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
