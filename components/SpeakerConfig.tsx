'use client'
import { useState } from 'react'
import { Speaker, VoiceInfo } from '@/types/dialogue'

interface Props {
  speakers: Speaker[]
  availableVoices: VoiceInfo[]
  onChange: (speakers: Speaker[]) => void
}

export default function SpeakerConfig({ speakers, availableVoices, onChange }: Props) {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)

  const previewVoice = async (voiceId: string, engine: string) => {
    if (previewingVoice === voiceId) return
    setPreviewingVoice(voiceId)
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: voiceId, engine }),
      })
      const data = await res.json()
      if (data.audio_data) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio_data}`)
        audio.onended = () => setPreviewingVoice(null)
        audio.play()
      } else {
        setPreviewingVoice(null)
      }
    } catch {
      setPreviewingVoice(null)
    }
  }

  const updateVoice = (i: number, voice: string) => {
    const updated = [...speakers]
    updated[i] = { ...updated[i], voice }
    onChange(updated)
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Locuteurs</label>
      <div className="space-y-2">
        {speakers.map((spk, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: spk.color }}
            >
              {spk.label}
            </span>
            <select
              value={spk.voice}
              onChange={e => updateVoice(i, e.target.value)}
              className="flex-1 border border-jfb-bordure px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-jfb-rose" style={{ borderRadius: '2px' }}
            >
              {availableVoices.map(v => (
                <option key={v.id} value={v.id}>{v.label} ({v.gender})</option>
              ))}
            </select>
            <button
              onClick={() => {
                const voiceInfo = availableVoices.find(v => v.id === spk.voice)
                previewVoice(spk.voice, voiceInfo?.engine ?? 'edge-tts')
              }}
              disabled={previewingVoice === spk.voice}
              title="Écouter un extrait"
              className="w-8 h-8 flex items-center justify-center border border-jfb-bordure bg-jfb-subtil hover:bg-jfb-beige text-jfb-gris disabled:opacity-40 flex-shrink-0"
              style={{ borderRadius: '2px' }}
            >
              {previewingVoice === spk.voice ? '⏳' : '▶'}
            </button>
            </div>
        ))}
      </div>
    </div>
  )
}
