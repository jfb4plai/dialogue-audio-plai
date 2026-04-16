'use client'
import { Speaker, VoiceInfo } from '@/types/dialogue'

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']

interface Props {
  speakers: Speaker[]
  availableVoices: VoiceInfo[]
  onChange: (speakers: Speaker[]) => void
}

export default function SpeakerConfig({ speakers, availableVoices, onChange }: Props) {
  const addSpeaker = () => {
    if (speakers.length >= 4) return
    const label = String.fromCharCode(65 + speakers.length) // A, B, C, D
    onChange([...speakers, {
      label,
      voice: availableVoices[speakers.length % availableVoices.length]?.id ?? '',
      color: COLORS[speakers.length],
    }])
  }

  const removeSpeaker = (i: number) => {
    onChange(speakers.filter((_, idx) => idx !== i))
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
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableVoices.map(v => (
                <option key={v.id} value={v.id}>{v.label} ({v.gender})</option>
              ))}
            </select>
            {speakers.length > 2 && (
              <button
                onClick={() => removeSpeaker(i)}
                className="text-gray-400 hover:text-red-500 text-lg"
              >×</button>
            )}
          </div>
        ))}
      </div>
      {speakers.length < 4 && (
        <button
          onClick={addSpeaker}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Ajouter un locuteur
        </button>
      )}
    </div>
  )
}
