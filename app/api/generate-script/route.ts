import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Simple in-memory rate limiter: max 10 requests/hour per IP
const rateMap = new Map<string, { count: number; resetAt: number }>()
const MAX_PER_HOUR = 10
const HOUR_MS = 60 * 60 * 1000

const LOCALE_LABELS: Record<string, string> = {
  nl_BE: 'néerlandais de Belgique (flamand)',
  nl_NL: 'néerlandais des Pays-Bas',
  fr_FR: 'français',
  de_DE: 'allemand',
  en_GB: 'anglais britannique (UK)',
}

const SPEAKER_LABELS: Record<string, string> = {
  dialogue: 'A et B (deux locuteurs alternés)',
  monologue: 'A uniquement (un seul locuteur)',
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_PER_HOUR) {
      return NextResponse.json(
        { error: `Limite atteinte : ${MAX_PER_HOUR} générations par heure. Réessayez plus tard.` },
        { status: 429 }
      )
    }
    entry.count++
  } else {
    rateMap.set(ip, { count: 1, resetAt: now + HOUR_MS })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Clé API non configurée.' }, { status: 500 })
  }

  const body = await req.json()
  const {
    locale = 'nl_BE',
    niveau = 'S5',
    filiere = 'service en salle',
    sujet = '',
    nb_repliques = 20,
    registre = 'mixte',
    vocabulaire = '',
    type_dialogue = 'dialogue',
  } = body

  const langue = LOCALE_LABELS[locale] ?? locale
  const locuteurs = SPEAKER_LABELS[type_dialogue] ?? SPEAKER_LABELS.dialogue
  const vocNote = vocabulaire.trim()
    ? `\n- Vocabulaire à inclure obligatoirement : ${vocabulaire.trim()}`
    : ''

  const systemPrompt = `Tu génères des scripts de dialogue pédagogiques pour des enseignants de la Fédération Wallonie-Bruxelles.

RÈGLES ABSOLUES DE FORMAT :
1. Chaque réplique commence par "A: " ou "B: " (suivi d'un espace)
2. Pour un monologue, utilise uniquement "A: "
3. ZÉRO markdown : pas de **, *, #, _, tirets de liste
4. ZÉRO introduction, titre, commentaire ou conclusion
5. ZÉRO numérotation de lignes
6. Uniquement les répliques du dialogue, rien d'autre

EXEMPLE DE FORMAT CORRECT :
A: Goedemorgen, kan ik u helpen?
B: Ja, graag. Ik zoek een tafel voor twee personen.
A: Komt u maar mee, meneer.`

  const userPrompt = `Génère un dialogue en ${langue}.

Paramètres :
- Type : ${locuteurs}
- Nombre de répliques : ${nb_repliques}
- Niveau scolaire : ${niveau} professionnel FWB
- Filière : ${filiere}
- Sujet : ${sujet || 'conversation professionnelle courante'}
- Registre : ${registre}${vocNote}

Génère maintenant le dialogue. Format strict : une réplique par ligne, préfixe A: ou B: uniquement.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Post-processing: keep only valid A:/B:/C:/D: lines, strip markdown
    const lines = raw.split('\n')
    const clean = lines
      .map(l => l.trim())
      .filter(l => /^[A-D]:\s/.test(l))
      .map(l => l.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, ''))
      .join('\n')

    if (!clean) {
      return NextResponse.json({ error: 'Le modèle n\'a pas produit de format valide. Réessayez.' }, { status: 500 })
    }

    return NextResponse.json({ script: clean })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
