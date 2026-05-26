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

  // Extraction texte
  let rawText = ''
  try {
    if (filename.endsWith('.pdf')) {
      // pdfjs-dist v5 needs DOMMatrix (browser API absent in Node.js)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (globalThis as any).DOMMatrix === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(globalThis as any).DOMMatrix = class DOMMatrix {
          a=1; b=0; c=0; d=1; e=0; f=0
          m11=1; m12=0; m13=0; m14=0
          m21=0; m22=1; m23=0; m24=0
          m31=0; m32=0; m33=1; m34=0
          m41=0; m42=0; m43=0; m44=1
          is2D=true; isIdentity=true
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          constructor(init?: number[]) {
            if (Array.isArray(init) && init.length === 6) {
              this.a=init[0]; this.b=init[1]; this.c=init[2]
              this.d=init[3]; this.e=init[4]; this.f=init[5]
              this.m11=init[0]; this.m12=init[1]; this.m21=init[2]
              this.m22=init[3]; this.m41=init[4]; this.m42=init[5]
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          multiply(o: any) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new (globalThis as any).DOMMatrix([
              this.a*o.a + this.c*o.b,
              this.b*o.a + this.d*o.b,
              this.a*o.c + this.c*o.d,
              this.b*o.c + this.d*o.d,
              this.a*o.e + this.c*o.f + this.e,
              this.b*o.e + this.d*o.f + this.f,
            ])
          }
          translate(tx=0, ty=0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new (globalThis as any).DOMMatrix([this.a,this.b,this.c,this.d,this.e+tx,this.f+ty])
          }
          scale(sx=1, sy=sx) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new (globalThis as any).DOMMatrix([this.a*sx,this.b*sx,this.c*sy,this.d*sy,this.e,this.f])
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transformPoint(p: any) { return { x: this.a*p.x+this.c*p.y+this.e, y: this.b*p.x+this.d*p.y+this.f } }
          inverse() {
            const det = this.a*this.d - this.b*this.c
            if (!det) return new (globalThis as any).DOMMatrix() // eslint-disable-line @typescript-eslint/no-explicit-any
            const id = 1/det
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new (globalThis as any).DOMMatrix([
              this.d*id, -this.b*id, -this.c*id, this.a*id,
              (this.c*this.f - this.d*this.e)*id,
              (this.b*this.e - this.a*this.f)*id,
            ])
          }
        }
      }
      // pdf-parse v2 : API classe, pas de default export
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { PDFParse } = await import('pdf-parse') as any
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      rawText = result.text
    } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value
    } else {
      return NextResponse.json({ error: 'Format non supporté. Utilisez un fichier .pdf ou .docx.' }, { status: 400 })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Impossible de lire le fichier : ${msg}` }, { status: 422 })
  }

  rawText = rawText.trim()
  if (!rawText || rawText.length < 50) {
    return NextResponse.json({ error: 'Le document ne contient pas assez de texte exploitable.' }, { status: 422 })
  }

  // Tronque pour ne pas exploser les tokens
  const docText = rawText.length > MAX_TEXT_CHARS
    ? rawText.slice(0, MAX_TEXT_CHARS) + '\n[… document tronqué …]'
    : rawText

  const langue = LOCALE_LABELS[locale] ?? locale
  const letters = ['A', 'B', 'C', 'D'].slice(0, nb_locuteurs)

  // Profils Gemini optionnels
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
3. ZÉRO introduction, titre, commentaire, conclusion
4. ZÉRO numérotation
5. Uniquement les répliques, rien d'autre
6. LANGUE STRICTE : TOUT le texte en ${langue} — aucun mot dans une autre langue

EXEMPLE :
A: Goedemorgen, kan ik u helpen?
B: Ja, graag. Ik zoek een tafel voor twee personen.`

  const userPrompt = `Voici un document source :

---
${docText}
---

Sur la base de ce contenu, génère un ${mode} en ${langue}.
Locuteurs : ${locuteurs}${profilesNote}
Nombre de répliques : environ ${mode === 'podcast' ? 40 : 20}
Le ${mode} doit rester fidèle aux idées du document tout en étant naturel et pédagogique.
Format strict : une réplique par ligne, préfixe ${letters.map(l => l + ':').join(' ou ')} uniquement.`

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
