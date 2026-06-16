import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_TEXT_CHARS = 15_000           // tronque le document avant envoi à Claude

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

  // Parse le multipart
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Requête multipart invalide.' }, { status: 400 })
  }

  const fileEntry = formData.get('file')
  const locale     = (formData.get('locale') as string)     || 'nl_BE'
  const nbStr      = (formData.get('nb_locuteurs') as string) || '2'
  const mode       = (formData.get('mode') as string)       || 'dialogue'
  const niveau     = (formData.get('niveau') as string)     || ''
  const profilesRaw = formData.get('gemini_profiles') as string | null

  if (!fileEntry || !(fileEntry instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 })
  }

  const nb_locuteurs = Math.min(4, Math.max(2, parseInt(nbStr, 10) || 2))

  if (fileEntry.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 MB).' }, { status: 413 })
  }

  const filename = fileEntry.name.toLowerCase()
  const buffer = Buffer.from(await fileEntry.arrayBuffer())

  const langue = LOCALE_LABELS[locale] ?? locale
  const letters = ['A', 'B', 'C', 'D'].slice(0, nb_locuteurs)

  // Profils optionnels
  let profilesNote = ''
  if (profilesRaw) {
    try {
      const profiles = JSON.parse(profilesRaw)
      if (Array.isArray(profiles)) {
        const lines = profiles
          .map((p: Record<string, string>) => {
            const parts = [
              p.name          ? `prénom : ${p.name}` : null,
              p.age           ? `âge : ${p.age}` : null,
              p.role          ? `rôle : ${p.role}` : null,
              p.nativeLanguage? `langue maternelle : ${p.nativeLanguage}` : null,
              p.personality   ? `personnalité : ${p.personality}` : null,
            ].filter(Boolean)
            return parts.length ? `  ${p.label} — ${parts.join(', ')}` : null
          })
          .filter(Boolean)
        if (lines.length) profilesNote = `\nPersonnages :\n${lines.join('\n')}`
      }
    } catch { /* ignore */ }
  }

  const isMono = mode === 'podcast' ? false : nb_locuteurs === 1
  const locuteurs = isMono
    ? 'A uniquement (monologue)'
    : `${letters.join(', ')} (${nb_locuteurs} locuteurs alternés)`

  const isPodcast = mode === 'podcast'

  const CEFR_DESC: Record<string, string> = {
    A1: 'A1 — phrases de 5 à 7 mots max, vocabulaire concret des 500 mots les plus fréquents, présent et impératif uniquement',
    A2: 'A2 — phrases simples 8-12 mots, vocabulaire quotidien (~1500 mots), passé composé et futur proche autorisés',
    B1: 'B1 — phrases variées jusqu\'à 15 mots, vocabulaire intermédiaire, expressions idiomatiques courantes',
    B2: 'B2 — phrases complexes, registre semi-soutenu, argumentation, connecteurs logiques, nuances',
    C1: 'C1 — registres variés, structures sophistiquées, vocabulaire étendu, implicite assumé',
    C2: 'C2 — maîtrise parfaite, précision lexicale maximale, registre soutenu',
  }
  const niveauNote = niveau.trim() ? `\n6. NIVEAU CECRL STRICT : ${CEFR_DESC[niveau.trim()] ?? niveau.trim()} — adapter TOUTES les répliques à ce niveau sans exception` : ''
  const introRule = isPodcast
    ? `\n5. PREMIÈRE RÉPLIQUE OBLIGATOIRE (intro podcast) : "A: Bonjour, [formule d'accueil]. Aujourd'hui, [sujet du document en 1-2 phrases]. [Présentation de B si pertinent selon les profils]."
6. DERNIÈRES RÉPLIQUES OBLIGATOIRES (outro podcast) : les 2-3 dernières répliques closent le podcast — prise de congé, mot de remerciement, formule de fin.${niveauNote}`
    : `\n5. CONCLUSION OBLIGATOIRE : les 2 dernières répliques closent naturellement l'échange.${niveauNote}`

  const systemPrompt = `Tu génères des scripts de ${mode} pédagogiques pour des enseignants de la Fédération Wallonie-Bruxelles, à partir d'un document source.

RÈGLES ABSOLUES DE FORMAT :
1. Chaque réplique commence par une lettre majuscule suivie de ": " — lettres : ${letters.join(', ')}
2. ZÉRO markdown : pas de **, *, #, _, tirets de liste
3. ZÉRO titre, commentaire, numérotation — uniquement les répliques
4. LANGUE STRICTE : TOUT le texte en ${langue} — aucun mot dans une autre langue${introRule}

EXEMPLE :
A: Goedemorgen, kan ik u helpen?
B: Ja, graag. Ik zoek een tafel voor twee personen.`

  const scriptInstructions = `Sur la base de ce contenu, génère un ${mode} en ${langue}.
Locuteurs : ${locuteurs}${profilesNote}
Nombre de répliques : exactement ${isPodcast ? 50 : 20} — ni plus, ni moins.
Le ${mode} couvre les idées principales du document, de façon naturelle et pédagogique.
Format strict : une réplique par ligne, préfixe ${letters.map(l => l + ':').join(' ou ')} uniquement.`

  // Construit le contenu du message selon le type de fichier
  // PDF : envoyé directement à Claude (évite les problèmes worker pdfjs en serverless)
  // DOCX : extraction mammoth puis texte dans le prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messageContent: any

  if (filename.endsWith('.pdf')) {
    // Tronquer les PDFs volumineux : si le buffer dépasse ~20 MB base64 (~15 MB binaire),
    // on sélectionne uniquement les premiers 15 000 chars après extraction texte.
    // Pour les PDFs de taille raisonnable, on envoie en natif (meilleure qualité).
    const pdfSizeLimit = 15 * 1024 * 1024 // 15 MB binaire
    if (buffer.length > pdfSizeLimit) {
      // Fallback texte : tronquer le buffer avant encodage base64
      const truncatedBuffer = buffer.subarray(0, pdfSizeLimit)
      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: truncatedBuffer.toString('base64'),
          },
        },
        { type: 'text', text: scriptInstructions + '\n[Document tronqué à 15 MB — premières pages uniquement]' },
      ]
    } else {
      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: buffer.toString('base64'),
          },
        },
        { type: 'text', text: scriptInstructions },
      ]
    }
  } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
    let rawText = ''
    try {
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value.trim()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: `Impossible de lire le fichier : ${msg}` }, { status: 422 })
    }
    if (!rawText || rawText.length < 50) {
      return NextResponse.json({ error: 'Le document ne contient pas assez de texte exploitable.' }, { status: 422 })
    }
    const docText = rawText.length > MAX_TEXT_CHARS
      ? rawText.slice(0, MAX_TEXT_CHARS) + '\n[… document tronqué …]'
      : rawText
    messageContent = `Voici un document source :\n\n---\n${docText}\n---\n\n${scriptInstructions}`
  } else {
    return NextResponse.json({ error: 'Format non supporté. Utilisez un fichier .pdf ou .docx.' }, { status: 400 })
  }

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

  // Nettoie les lignes : garde uniquement les répliques A:/B:/C:/D:
  const cleanLines = (raw: string) =>
    raw.split('\n')
      .map(l => l.trim())
      .filter(l => /^[A-D]:\s/.test(l))
      .map(l => l.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, ''))
      .join('\n')

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: isPodcast ? 6000 : 4096,
        messages: [{ role: 'user', content: messageContent }],
        system: systemPrompt,
      })
      const raw = message.content[0].type === 'text' ? message.content[0].text : ''
      const script = cleanLines(raw)
      if (!script) {
        return NextResponse.json({ error: 'Le modèle n\'a pas produit de format valide. Réessayez.' }, { status: 500 })
      }
      return NextResponse.json({ script })
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
