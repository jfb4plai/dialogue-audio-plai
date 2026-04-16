'use client'
import { Speaker } from '@/types/dialogue'

interface Props {
  script: string
  speakers: Speaker[]
  onChange: (script: string) => void
}

function estimateDuration(text: string): number {
  return Math.ceil(text.length / 50) * 3
}

export default function ScriptEditor({ script, speakers, onChange }: Props) {
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
      return {
        key: i,
        label: match[1],
        text: match[2].trim(),
        color: colorMap[match[1]] ?? '#6B7280',
      }
    }
    return { key: i, label: null, text: trimmed, color: null }
  })

  const scriptText = script
  const totalChars = lines
    .filter(l => /^[A-D]:/.test(l.trim()))
    .join('')
    .replace(/^[A-D]:/, '').length
  const estSecs = estimateDuration(scriptText.replace(/^[A-D]:/gm, ''))

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Script <span className="text-gray-400 font-normal">(format : A: texte / B: texte)</span>
      </label>
      <textarea
        value={script}
        onChange={e => onChange(e.target.value)}
        rows={8}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={"A: Goedemorgen!\nB: Goedemorgen! Hoe gaat het?\nA: Het gaat goed, dank je."}
      />
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
      <p className="mt-1 text-xs text-gray-500">
        {replyCount} réplique{replyCount > 1 ? 's' : ''} · {speakersFound.size} locuteur{speakersFound.size > 1 ? 's' : ''} · ~{estSecs}s estimées
      </p>
    </div>
  )
}
