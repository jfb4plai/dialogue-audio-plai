'use client'
import { useRef, useState } from 'react'
import { Speaker } from '@/types/dialogue'

interface Props {
  script: string
  speakers: Speaker[]
  targetLocale: string
  onChange: (script: string) => void
}

function estimateDuration(text: string): number {
  return Math.ceil(text.length / 50) * 3
}

// DeepL language codes (source: always fr)
const LANG_CODES: Record<string, string> = {
  nl_BE: 'nl',
  nl_NL: 'nl',
  de_DE: 'de',
  en_GB: 'en',
  fr_FR: 'fr',
  fr_BE: 'fr',
  es_ES: 'es',
  it_IT: 'it',
}

export default function ScriptEditor({ script, speakers, targetLocale, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)

  const colorMap: Record<string, string> = {}
  speakers.forEach(s => { colorMap[s.label] = s.color })

  const lines = script.split('\n')
  let replyCount = 0
  const speakersFound = new Set<string>()

  const parsedLines = lines.map((line, i) => {
    const trimmed = line.trim()
    const match = trimmed.match(/^([A-D]):(.*)$/)
    if (match) {
      replyCount++
      speakersFound.add(match[1])
      return { key: i, label: match[1], text: match[2].trim(), color: colorMap[match[1]] ?? '#6B7280' }
    }
    return { key: i, label: null, text: trimmed, color: null }
  })

  const estSecs = estimateDuration(script.replace(/^[A-D]:/gm, ''))
  const limitWarning = replyCount > 60

  // Word import via mammoth (client-side)
  const handleWordImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const mammoth = (await import('mammoth')).default
    const arrayBuffer = await file.arrayBuffer()
    const { value } = await mammoth.extractRawText({ arrayBuffer })
    // Try to keep existing A:/B: format if already present, else show raw text
    onChange(value.trim())
    if (fileRef.current) fileRef.current.value = ''
  }

  // Translate script via DeepL
  const handleTranslate = async () => {
    const targetCode = LANG_CODES[targetLocale]
    if (!targetCode || targetCode === 'fr') return
    setTranslating(true)
    setTranslateError(null)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, sourceLang: 'fr', targetLang: targetCode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onChange(data.script)
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : 'Erreur de traduction')
    } finally {
      setTranslating(false)
    }
  }

  const targetCode = LANG_CODES[targetLocale]
  const canTranslate = targetCode && targetCode !== 'fr' && script.trim().length > 0

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-jfb-noir">
          Script <span className="text-jfb-gris font-normal">(format : A: texte / B: texte)</span>
        </label>
        <div className="flex gap-2">
          {/* Word import */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs px-2 py-1 border border-jfb-bordure text-jfb-gris hover:border-jfb-noir hover:text-jfb-noir transition-colors"
            style={{ borderRadius: '2px' }}
          >
            Importer Word
          </button>
          <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={handleWordImport} />

          {/* Translate button — shown only if target ≠ fr */}
          {canTranslate && (
            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating}
              className="text-xs px-2 py-1 border border-jfb-rose text-jfb-rose hover:bg-jfb-beige disabled:opacity-50 transition-colors"
              style={{ borderRadius: '2px' }}
            >
              {translating ? 'Traduction...' : `Traduire → ${targetCode}`}
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 text-[11px] bg-jfb-beige border border-jfb-bordure px-3 py-2 text-jfb-gris leading-relaxed" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
        <strong className="text-jfb-noir">Format obligatoire :</strong> chaque réplique commence par une lettre majuscule suivie de deux-points.<br />
        <span className="font-mono text-jfb-noir">A: Bonjour !&nbsp;&nbsp;B: Bonjour, comment allez-vous ?&nbsp;&nbsp;A: Très bien, merci.</span>
      </div>
      <textarea
        value={script}
        onChange={e => onChange(e.target.value)}
        rows={8}
        className="w-full border border-jfb-bordure px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-jfb-rose bg-white"
        style={{ borderRadius: '2px' }}
        placeholder={"A: Goedemorgen!\nB: Goedemorgen! Hoe gaat het?\nA: Het gaat goed, dank je."}
      />
      {script.trim().length > 0 && replyCount === 0 && (
        <p className="mt-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1" style={{ borderRadius: '2px' }}>
          Aucune réplique reconnue. Vérifiez que chaque ligne commence bien par <strong>A:</strong>, <strong>B:</strong>, etc.
        </p>
      )}

      {canTranslate && (
        <p className="mt-1 text-xs text-jfb-gris-cl">
          Traduction via DeepL · disponible dans la limite du crédit — en cas de dépassement, contacter le Pôle.
        </p>
      )}
      {translateError && (
        <p className="mt-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1" style={{ borderRadius: '2px' }}>{translateError}</p>
      )}

      {/* Colored preview */}
      {replyCount > 0 && (
        <div className="mt-2 border border-jfb-bordure p-3 bg-white text-sm space-y-1" style={{ borderRadius: '2px' }}>
          {parsedLines.map(l =>
            l.label ? (
              <div key={l.key} className="flex gap-2">
                <span className="font-bold" style={{ color: l.color }}>{l.label}:</span>
                <span className="text-jfb-noir">{l.text}</span>
              </div>
            ) : null
          )}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-jfb-gris">
          {replyCount} réplique{replyCount > 1 ? 's' : ''} · {speakersFound.size} locuteur{speakersFound.size > 1 ? 's' : ''} · ~{estSecs}s estimées
        </p>
        {limitWarning && (
          <p className="text-xs text-amber-600">
            ⚠ +60 répliques : risque de timeout (limite serveur ~3 min)
          </p>
        )}
      </div>
    </div>
  )
}
