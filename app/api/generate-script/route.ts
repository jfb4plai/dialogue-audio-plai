import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const rateMap = new Map<string, { count: number; resetAt: number }>()
const MAX_PER_HOUR = 10
const HOUR_MS = 60 * 60 * 1000

const LOCALE_LABELS: Record<string, string> = {
  nl_BE: 'néerlandais de Belgique (flamand)',
  nl_NL: 'néerlandais des Pays-Bas',
  fr_FR: 'français',
  fr_BE: 'français (Belgique)',
  de_DE: 'allemand',
  en_GB: 'anglais britannique (UK)',
  es_ES: 'espagnol',
}

export async function POST(req: NextRequest) {
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
  const { locale = 'nl_BE', type_dialogue = 'dialogue' } = body
  const langue = LOCALE_LABELS[locale] ?? locale

  // ── Podcast mode ──────────────────────────────────────────────────────────
  if (type_dialogue === 'podcast') {
    const {
      sujet = '',
      role_a = 'Animateur/trice',
      role_b = 'Expert(e)',
      nb_repliques = 40,
      source_text = '',
    } = body

    const sourceNote = source_text.trim()
      ? `\n\nSource de référence (extrait ou résumé — utilise ces informations pour enrichir le contenu) :\n"""\n${source_text.trim().slice(0, 3000)}\n"""`
      : ''

    const systemPrompt = `Tu génères des scripts de podcast pédagogiques pour des enseignants.

RÈGLES ABSOLUES DE FORMAT :
1. Chaque réplique commence par "A: " ou "B: " (suivi d'un espace)
2. ZÉRO markdown : pas de **, *, #, _, tirets de liste
3. ZÉRO introduction, titre, commentaire ou conclusion
4. ZÉRO numérotation de lignes
5. Uniquement les répliques du podcast, rien d'autre

DYNAMIQUE PODCAST :
- A (${role_a}) : mène le débat, pose les questions, relance, challenge, vulgarise
- B (${role_b}) : répond avec expertise, apporte des exemples concrets, nuance
- Les répliques sont naturelles, vivantes, parfois courtes, parfois plus développées
- A et B interagissent vraiment (rebonds, reformulations, désaccords constructifs)

EXEMPLE DE FORMAT CORRECT :
A: Alors, commençons directement. Qu'est-ce qui vous a amené à vous intéresser à ce sujet ?
B: C'est une bonne question. En réalité, tout a commencé il y a quelques années quand...
A: Attendez, vous voulez dire que...`

    const userPrompt = `Génère un podcast en ${langue}.

Paramètres :
- A = ${role_a}
- B = ${role_b}
- Sujet : ${sujet || 'conversation générale'}
- Nombre de répliques : ${nb_repliques}${sourceNote}

Génère maintenant le podcast. Format strict : une réplique par ligne, préfixe A: ou B: uniquement.`

    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      })
      const raw = message.content[0].type === 'text' ? message.content[0].text : ''
      const clean = raw.split('\n')
        .map(l => l.trim())
        .filter(l => /^[A-B]:\s/.test(l))
        .map(l => l.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, ''))
        .join('\n')
      if (!clean) return NextResponse.json({ error: 'Format invalide. Réessayez.' }, { status: 500 })
      return NextResponse.json({ script: clean })
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
    }
  }

  // ── Dialogue / Monologue mode ─────────────────────────────────────────────
  const {
    niveau = '', filiere = '', contexte = '', sujet = '',
    nb_repliques = 20, registre = 'mixte', vocabulaire = '',
  } = body

  const vocNote = vocabulaire.trim() ? `\n- Vocabulaire à inclure obligatoirement : ${vocabulaire.trim()}` : ''
  const niveauNote = niveau.trim() ? `\n- Niveau : ${niveau.trim()}` : ''
  const filiereNote = filiere.trim() ? `\n- Filière / domaine : ${filiere.trim()}` : ''
  const contexteNote = contexte.trim() ? `\n- Contexte situationnel : ${contexte.trim()}` : ''
  const locuteurs = type_dialogue === 'monologue' ? 'A uniquement (un seul locuteur)' : 'A et B (deux locuteurs alternés)'

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
- Sujet : ${sujet || 'conversation courante'}
- Registre : ${registre}${niveauNote}${filiereNote}${contexteNote}${vocNote}

Génère maintenant le dialogue. Format strict : une réplique par ligne, préfixe A: ou B: uniquement.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })
    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = raw.split('\n')
      .map(l => l.trim())
      .filter(l => /^[A-D]:\s/.test(l))
      .map(l => l.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, ''))
      .join('\n')
    if (!clean) return NextResponse.json({ error: 'Le modèle n\'a pas produit de format valide. Réessayez.' }, { status: 500 })
    return NextResponse.json({ script: clean })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, { status: 500 })
  }
}
