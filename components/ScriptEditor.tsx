'use client'
import { useEffect, useRef, useState } from 'react'
import { Speaker } from '@/types/dialogue'

interface Props {
  script: string
  speakers: Speaker[]
  targetLocale: string
  onChange: (script: string) => void
  onActiveEpisodeChange?: (episodeScript: string, episodeIdx: number) => void
}

function estimateDuration(text: string): number {
  return Math.ceil(text.length / 50) * 3
}

interface Episode { title: string; content: string }

function parseEpisodes(script: string): Episode[] {
  const lines = script.split('\n')
  const episodes: Episode[] = []
  let currentTitle = ''
  let currentLines: string[] = []

  const isMarker = (l: string) => {
    const t = l.trim()
    return t.startsWith('[') && t.endsWith(']') && /\d/.test(t) && t.length < 25
  }

  for (const line of lines) {
    if (isMarker(line)) {
      if (currentTitle || currentLines.some(l => l.trim())) {
        episodes.push({ title: currentTitle, content: currentLines.join('\n').trim() })
      }
      const num = line.trim().match(/(\d+)/)?.[1] ?? String(episodes.length + 1)
      currentTitle = `Épisode ${num}`
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }
  if (currentLines.some(l => l.trim())) {
    episodes.push({ title: currentTitle, content: currentLines.join('\n').trim() })
  }
  if (episodes.length <= 1 && !episodes[0]?.title) return [{ title: '', content: script }]
  return episodes
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

export default function ScriptEditor({ script, speakers, targetLocale, onChange, onActiveEpisodeChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [activeEpisodeIdx, setActiveEpisodeIdx] = useState(0)

  const colorMap: Record<string, string> = {}
  speakers.forEach(s => { colorMap[s.label] = s.color })

  const episodes = parseEpisodes(script)
  const hasEpisodes = episodes.length > 1 || !!episodes[0]?.title

  // Reset active episode when script changes (new generation)
  useEffect(() => { setActiveEpisodeIdx(0) }, [script])

  // Notify parent of active episode script
  useEffect(() => {
    if (onActiveEpisodeChange) {
      onActiveEpisodeChange(episodes[activeEpisodeIdx]?.content ?? script, activeEpisodeIdx)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEpisodeIdx, script])

  const activeContent = episodes[activeEpisodeIdx]?.content ?? script

  const lines = activeContent.split('\n')
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

  // Total stats for the whole script
  const totalLines = script.split('\n')
  let totalReplyCount = 0
  totalLines.forEach(l => { if (l.trim().match(/^[A-D]:/) ) totalReplyCount++ })

  const estSecs = estimateDuration(activeContent.replace(/^[A-D]:/gm, ''))
  const limitWarning = totalReplyCount > 60

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

      {/* Episode tabs — shown only when script has [ÉPISODE N] markers */}
      {hasEpisodes && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {episodes.map((ep, idx) => {
            const epSecs = estimateDuration(ep.content.replace(/^[A-D]:/gm, ''))
            return (
              <button
                key={idx}
                onClick={() => setActiveEpisodeIdx(idx)}
                className={`text-xs px-3 py-1.5 border font-medium transition-colors ${activeEpisodeIdx === idx ? 'bg-jfb-noir text-white border-jfb-noir' : 'bg-white text-jfb-gris border-jfb-bordure hover:border-jfb-noir'}`}
                style={{ borderRadius: '2px' }}
              >
                {ep.title} <span className="opacity-70 font-normal">~{epSecs}s</span>
              </button>
            )
          })}
        </div>
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
          {hasEpisodes
            ? `${replyCount} réplique${replyCount > 1 ? 's' : ''} · ~${estSecs}s — épisode actif · ${totalReplyCount} au total`
            : `${replyCount} réplique${replyCount > 1 ? 's' : ''} · ${speakersFound.size} locuteur${speakersFound.size > 1 ? 's' : ''} · ~${estSecs}s estimées`
          }
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
