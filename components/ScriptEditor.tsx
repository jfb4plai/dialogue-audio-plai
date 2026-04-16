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

// LibreTranslate language codes (source: always fr)
const LANG_CODES: Record<string, string> = {
  nl_BE: 'nl',
  nl_NL: 'nl',
  de_DE: 'de',
  en_GB: 'en',
  fr_FR: 'fr',
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

  // Translate script via LibreTranslate
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
        <label className="block text-sm font-medium text-gray-700">
          Script <span className="text-gray-400 font-normal">(format : A: texte / B: texte)</span>
        </label>
        <div className="flex gap-2">
          {/* Word import */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs px-2 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
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
              className="text-xs px-2 py-1 border border-blue-400 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              {translating ? 'Traduction...' : `Traduire → ${targetCode}`}
            </button>
          )}
        </div>
      </div>

      <textarea
        value={script}
        onChange={e => onChange(e.target.value)}
        rows={8}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={"A: Goedemorgen!\nB: Goedemorgen! Hoe gaat het?\nA: Het gaat goed, dank je."}
      />

      {translateError && (
        <p className="mt-1 text-xs text-red-500">{translateError}</p>
      )}

      {/* Colored preview */}
      {replyCount > 0 && (
        <div className="mt-2 border border-gray-100 rounded-lg p-3 bg-white text-sm space-y-1">
          {parsedLines.map(l =>
            l.label ? (
              <div key={l.key} className="flex gap-2">
                <span className="font-bold" style={{ color: l.color }}>{l.label}:</span>
                <span className="text-gray-800">{l.text}</span>
              </div>
            ) : null
          )}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-gray-500">
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
