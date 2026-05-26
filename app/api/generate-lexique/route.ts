import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const rateMap = new Map<string, { count: number; resetAt: number }>()
const MAX_PER_HOUR = 10
const HOUR_MS = 60 * 60 * 1000

const LOCALE_LABELS: Record<string, string> = {
  nl_BE: 'néerlandais de Belgique',
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
      return NextResponse.json({ error: 'Limite atteinte : 10 générations par heure.' }, { status: 429 })
    }
    entry.count++
  } else {
    rateMap.set(ip, { count: 1, resetAt: now + HOUR_MS })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Clé API non configurée.' }, { status: 500 })
  }

  const { script, locale = 'nl_BE', niveau = '', vocabulaire = '' } = await req.json()
  if (!script?.trim()) {
    return NextResponse.json({ error: 'Script manquant.' }, { status: 400 })
  }

  const langue = LOCALE_LABELS[locale] ?? 'la langue du dialogue'

  const niveauNote = niveau.trim() ? `\n- Niveau des apprenants : ${niveau.trim()} (adapte la difficulté des mots sélectionnés)` : ''
  const vocForcéNote = vocabulaire.trim()
    ? `\n- Vocabulaire obligatoire à inclure (ces mots DOIVENT figurer dans la sélection s'ils apparaissent dans le dialogue) : ${vocabulaire.trim()}`
    : ''

  const userPrompt = `À partir de ce dialogue en ${langue}, sélectionne 8 à 12 mots ou expressions-clés utiles pour une activité lexicale pédagogique (ni trop fréquents, ni trop rares — évite les mots grammaticaux).${niveauNote}${vocForcéNote}

DIALOGUE :
${script}

Pour chaque mot/expression :
- "word" : le mot tel qu'il apparaît dans le dialogue (forme exacte)
- "translation" : traduction courte en français
- "example" : phrase exacte du dialogue où le mot apparaît (citation complète)
- "reuse" : phrase courte en ${langue} avec "___" à la place du mot (phrase de réemploi à compléter par l'élève — différente de l'exemple)

FORMAT JSON strict, rien d'autre :
[{"word":"...","translation":"...","example":"...","reuse":"..."}]`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
      system: 'Tu es un assistant pédagogique expert en didactique des langues étrangères. Tu génères des activités lexicales structurées conformes aux pratiques de contextualisation recommandées en didactique du FLE/LVE.',
    })
    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: 'Format invalide. Réessayez.' }, { status: 500 })
    const items = JSON.parse(jsonMatch[0])
    return NextResponse.json({ items })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
