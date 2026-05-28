import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUserId } from '@/lib/get-user-id'
import { checkRateLimit } from '@/lib/rate-limit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  const userId = await getUserId(req)
  const rl = await checkRateLimit(req, userId, { anonMax: 20, authMax: 40 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Limite atteinte : 20 générations par heure.' }, { status: 429 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Clé API non configurée.' }, { status: 500 })
  }

  const { script, locale = 'nl_BE', question_lang = 'fr' } = await req.json()
  if (!script?.trim()) {
    return NextResponse.json({ error: 'Script manquant.' }, { status: 400 })
  }
  if (String(script).length > 8000) {
    return NextResponse.json({ error: 'Script trop long (max 8 000 caractères).' }, { status: 400 })
  }

  const langue = LOCALE_LABELS[locale] ?? 'la langue du dialogue'
  const questionLangLabel = question_lang === 'locale' ? langue : 'français'

  const systemPrompt = `Tu es un assistant pédagogique. Tu génères des questions de compréhension Vrai/Faux à partir de dialogues audio pour des apprenants en langue étrangère.`

  const userPrompt = `À partir de ce dialogue en ${langue}, génère exactement 5 questions de compréhension de type Vrai/Faux.

DIALOGUE :
${script}

RÈGLES :
- Les questions portent sur des faits précis du dialogue (pas d'interprétation)
- Chaque question est formulée en ${questionLangLabel}
- Réponse : toujours "Vrai" ou "Faux" (en français, dans le champ "answer")
- Justification : courte phrase citant ou paraphrasant le dialogue, en ${questionLangLabel}

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
