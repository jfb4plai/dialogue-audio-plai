import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'

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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_TEXT_CHARS = 15_000           // tronque le document avant envoi à Claude

export async function POST(req: NextRequest) {
  // Rate limiting par IP
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

  const systemPrompt = `Tu génères des scripts de ${mode} pédagogiques pour des enseignants de la Fédération Wallonie-Bruxelles, à partir d'un document source.

RÈGLES ABSOLUES DE FORMAT :
1. Chaque réplique commence par une lettre majuscule suivie de ": " — lettres : ${letters.join(', ')}
2. ZÉRO markdown : pas de **, *, #, _, tirets de liste
3. ZÉRO titre, commentaire hors-script, numérotation
4. Uniquement les répliques, rien d'autre
5. LANGUE STRICTE : TOUT le texte en ${langue} — aucun mot dans une autre langue
6. CONCLUSION OBLIGATOIRE : les 2 dernières répliques closent naturellement l'échange — ne jamais s'arrêter en plein milieu d'une idée

EXEMPLE :
A: Goedemorgen, kan ik u helpen?
B: Ja, graag. Ik zoek een tafel voor twee personen.`

  const scriptInstructions = `Sur la base de ce contenu, génère un ${mode} en ${langue}.
Locuteurs : ${locuteurs}${profilesNote}
Nombre de répliques : environ ${mode === 'podcast' ? 40 : 20}
Le ${mode} doit couvrir les idées principales du document de façon naturelle et pédagogique, avec une conclusion construite.
Format strict : une réplique par ligne, préfixe ${letters.map(l => l + ':').join(' ou ')} uniquement.`

  // Construit le contenu du message selon le type de fichier
  // PDF : envoyé directement à Claude (évite les problèmes worker pdfjs en serverless)
  // DOCX : extraction mammoth puis texte dans le prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messageContent: any

  if (filename.endsWith('.pdf')) {
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

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: messageContent }],
        system: systemPrompt,
      })
      const raw = message.content[0].type === 'text' ? message.content[0].text : ''
      const clean = raw.split('\n')
        .map(l => l.trim())
        .filter(l => /^[A-D]:\s/.test(l))
        .map(l => l.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, ''))
        .join('\n')
      if (!clean) {
        return NextResponse.json({ error: 'Le modèle n\'a pas produit de format valide. Réessayez.' }, { status: 500 })
      }
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
