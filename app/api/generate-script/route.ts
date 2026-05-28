import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUserId } from '@/lib/get-user-id'
import { checkRateLimit } from '@/lib/rate-limit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  const userId = await getUserId(req)
  const rl = await checkRateLimit(req, userId, { anonMax: 10, authMax: 20 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Limite atteinte : 10 générations par heure. Réessayez plus tard.' },
      { status: 429 }
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Clé API non configurée.' }, { status: 500 })
  }

  const body = await req.json()
  const { locale = 'nl_BE', type_dialogue = 'dialogue', nb_locuteurs = 2 } = body
  const langue = LOCALE_LABELS[locale] ?? locale

  const {
    niveau = '', filiere = '', contexte = '', sujet = '',
    nb_repliques = 20, registre = 'mixte', vocabulaire = '',
    roles = [],
    gemini_profiles = null,
  } = body

  // Input length guards
  const LIMITS = { sujet: 300, contexte: 400, vocabulaire: 300, filiere: 150 }
  if (String(sujet).length > LIMITS.sujet || String(contexte).length > LIMITS.contexte ||
      String(vocabulaire).length > LIMITS.vocabulaire || String(filiere).length > LIMITS.filiere) {
    return NextResponse.json({ error: 'Un ou plusieurs champs dépassent la longueur maximale autorisée.' }, { status: 400 })
  }
  if (Array.isArray(roles) && roles.some((r: { role?: string }) => String(r.role ?? '').length > 200)) {
    return NextResponse.json({ error: 'Description de rôle trop longue (max 200 caractères).' }, { status: 400 })
  }
  const nbRep = Number(nb_repliques)
  if (!Number.isInteger(nbRep) || nbRep < 2 || nbRep > 80) {
    return NextResponse.json({ error: 'Nombre de répliques invalide (2–80).' }, { status: 400 })
  }

  // ── Niveau CECRL ────────────────────────────────────────────────────────────
  const CEFR_DESC: Record<string, string> = {
    A1: 'A1 — phrases de 5 à 7 mots maximum, vocabulaire concret des 500 mots les plus fréquents, présent et impératif uniquement, zéro expression idiomatique',
    A2: 'A2 — phrases simples de 8 à 12 mots, vocabulaire des situations quotidiennes (~1500 mots), passé composé et futur proche autorisés',
    B1: 'B1 — phrases variées jusqu\'à 15 mots, vocabulaire intermédiaire, expressions idiomatiques courantes, quelques subordonnées',
    B2: 'B2 — phrases complexes, registre semi-soutenu, argumentation structurée, connecteurs logiques, nuances de sens',
    C1: 'C1 — registres variés, structures syntaxiques sophistiquées, vocabulaire étendu, implicite et sous-entendu assumés',
    C2: 'C2 — maîtrise parfaite, précision lexicale maximale, registre soutenu, jeu sur les subtilités rhétoriques',
  }
  const niveauNote = niveau.trim()
    ? `\n- Niveau CECRL : ${CEFR_DESC[niveau.trim()] ?? niveau.trim()} — adapter STRICTEMENT la longueur des répliques, le choix lexical et la complexité syntaxique`
    : ''
  const filiereNote = filiere.trim() ? `\n- Filière / domaine : ${filiere.trim()}` : ''
  const contexteNote = contexte.trim() ? `\n- Contexte situationnel : ${contexte.trim()}` : ''

  // ── Rôles des locuteurs ──────────────────────────────────────────────────────
  const letters = ['A', 'B', 'C', 'D'].slice(0, Math.max(1, nb_locuteurs))
  const rolesArray: { label: string; role: string }[] = Array.isArray(roles) ? roles : []
  const rolesWithContent = rolesArray.filter(r => r.role?.trim())

  let rolesNote = ''
  if (rolesWithContent.length > 0) {
    const lines = rolesWithContent.map(r => `  ${r.label} : ${r.role.trim()}`)
    rolesNote = `\n- Rôles des personnages — IMPÉRATIF (le vocabulaire, le registre et l'initiative de chaque personnage DOIVENT correspondre à son rôle ; deux rôles différents = deux registres distincts) :\n${lines.join('\n')}`
  }

  // ── Vocabulaire cible ────────────────────────────────────────────────────────
  const vocNote = vocabulaire.trim()
    ? `\n- Mots cibles OBLIGATOIRES — chacun de ces mots DOIT apparaître au moins une fois dans le dialogue, réparti naturellement dans les répliques (pas tous groupés sur une seule ligne) : ${vocabulaire.trim()}`
    : ''

  // ── Profils Gemini (détails complémentaires) ─────────────────────────────────
  let profilesNote = ''
  if (gemini_profiles && Array.isArray(gemini_profiles)) {
    const profileLines = gemini_profiles
      .map((p: { label: string; name?: string; age?: string; nativeLanguage?: string; personality?: string; style?: string }) => {
        const parts = [
          p.name ? `prénom : ${p.name}` : null,
          p.age ? `âge : ${p.age}` : null,
          p.nativeLanguage ? `langue maternelle : ${p.nativeLanguage}` : null,
          p.personality ? `personnalité : ${p.personality}` : null,
          p.style ? `registre émotionnel : ${p.style}` : null,
        ].filter(Boolean)
        return parts.length ? `  ${p.label} — ${parts.join(', ')}` : null
      })
      .filter(Boolean)
    if (profileLines.length) {
      profilesNote = `\n- Détails complémentaires des personnages :\n${profileLines.join('\n')}`
    }
  }

  // ── Contraintes d'ouverture et de clôture ────────────────────────────────────
  const roleA = rolesWithContent.find(r => r.label === 'A')?.role ?? ''
  const ouvertureCtx = contexte.trim()
    ? `entrée en matière naturelle pour "${contexte.trim()}"${roleA ? ` (rôle de A : ${roleA})` : ''}`
    : `salutation ou amorce adaptée au sujet${roleA ? ` (rôle de A : ${roleA})` : ''}`

  const locuteurs = type_dialogue === 'monologue'
    ? 'A uniquement (monologue)'
    : `${letters.join(', ')} (${nb_locuteurs} locuteurs alternés)`

  // ── Prompts ──────────────────────────────────────────────────────────────────
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
- Registre : ${registre}${niveauNote}${filiereNote}${contexteNote}${rolesNote}${vocNote}${profilesNote}

CONTRAINTES DE STRUCTURE (non négociables) :
- Réplique d'ouverture : la 1re réplique de A est une ${ouvertureCtx} — elle amorce naturellement la situation, sans explication méta.
- Répliques de clôture : les 2 dernières répliques forment une fermeture explicite et complète — prise de congé, confirmation d'accord, résolution — cohérente avec les rôles et le contexte. Ne pas couper au milieu d'un échange.${vocabulaire.trim() ? `\n- Mots cibles : ${vocabulaire.trim().split(',').map((w: string) => w.trim()).filter(Boolean).join(', ')} — chacun doit apparaître au moins une fois dans le corps du dialogue.` : ''}

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
        await delay(2000 * (attempt + 1))
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
