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
  it_IT: 'italien',
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
  const { locale = 'nl_BE', type_dialogue = 'dialogue', nb_locuteurs = 2 } = body
  const langue = LOCALE_LABELS[locale] ?? locale

  // ── Dialogue / Monologue mode ─────────────────────────────────────────────
  const {
    niveau = '', filiere = '', contexte = '', sujet = '',
    nb_repliques = 20, registre = 'mixte', vocabulaire = '',
    gemini_profiles = null,
  } = body

  const vocNote = vocabulaire.trim() ? `\n- Vocabulaire à inclure obligatoirement : ${vocabulaire.trim()}` : ''
  const niveauNote = niveau.trim() ? `\n- Niveau : ${niveau.trim()}` : ''
  const filiereNote = filiere.trim() ? `\n- Filière / domaine : ${filiere.trim()}` : ''
  const contexteNote = contexte.trim() ? `\n- Contexte situationnel : ${contexte.trim()}` : ''
  const letters = ['A', 'B', 'C', 'D'].slice(0, Math.max(1, nb_locuteurs))
  const locuteurs = type_dialogue === 'monologue'
    ? 'A uniquement (monologue)'
    : `${letters.join(', ')} (${nb_locuteurs} locuteurs alternés)`

  // ── Gemini character profiles ─────────────────────────────────────────────
  let profilesNote = ''
  if (gemini_profiles && Array.isArray(gemini_profiles)) {
    const profileLines = gemini_profiles
      .map((p: { label: string; name?: string; age?: string; role?: string; nativeLanguage?: string; personality?: string; style?: string }) => {
        const parts = [
          p.name ? `prénom : ${p.name}` : null,
          p.age ? `âge : ${p.age}` : null,
          p.role ? `rôle : ${p.role}` : null,
          p.nativeLanguage ? `langue maternelle : ${p.nativeLanguage}` : null,
          p.personality ? `personnalité : ${p.personality}` : null,
          p.style ? `registre émotionnel : ${p.style}` : null,
        ].filter(Boolean)
        return parts.length ? `  ${p.label} — ${parts.join(', ')}` : null
      })
      .filter(Boolean)
    if (profileLines.length) {
      profilesNote = `\n- Personnages (à respecter dans les répliques) :\n${profileLines.join('\n')}`
    }
  }

  const systemPrompt = `Tu génères des scripts de dialogue pédagogiques pour des enseignants de la Fédération Wallonie-Bruxelles.

RÈGLES ABSOLUES DE FORMAT :
1. Chaque réplique commence par une lettre majuscule suivie de ": " — lettres utilisées : ${letters.join(', ')}
2. Pour un monologue, utilise uniquement "A: "
3. ZÉRO markdown : pas de **, *, #, _, tirets de liste
4. ZÉRO introduction, titre, commentaire ou conclusion
5. ZÉRO numérotation de lignes
6. Uniquement les répliques du dialogue, rien d'autre
7. LANGUE STRICTE : TOUT le texte doit être en ${langue} — aucun mot dans une autre langue.

EXEMPLE DE FORMAT CORRECT :
A: Goedemorgen, kan ik u helpen?
B: Ja, graag. Ik zoek een tafel voor twee personen.
A: Komt u maar mee, meneer.`

  const userPrompt = `Génère un dialogue en ${langue}.

Paramètres :
- Type : ${locuteurs}
- Nombre de répliques : ${nb_repliques}
- Sujet : ${sujet || 'conversation courante'}
- Registre : ${registre}${niveauNote}${filiereNote}${contexteNote}${vocNote}${profilesNote}

Génère maintenant le dialogue. Format strict : une réplique par ligne, préfixe ${letters.join(': ou ')+': uniquement'}. Tous les locuteurs (${letters.join(', ')}) doivent intervenir de façon équilibrée.`

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const isOverloaded = msg.includes('overloaded') || msg.includes('529')
      if (isOverloaded && attempt < 2) {
        await delay(2000 * (attempt + 1)) // 2s puis 4s
        continue
      }
      if (isOverloaded) {
        return NextResponse.json(
          { error: "L'IA est momentanément surchargée. Réessayez dans 1-2 minutes." },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: msg || 'Erreur inconnue' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
}
