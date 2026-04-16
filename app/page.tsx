'use client'
import { useEffect, useState } from 'react'
import LanguageSelector from '@/components/LanguageSelector'
import SpeakerConfig from '@/components/SpeakerConfig'
import ScriptEditor from '@/components/ScriptEditor'
import SilenceSlider from '@/components/SilenceSlider'
import GenerateButton from '@/components/GenerateButton'
import AudioResult from '@/components/AudioResult'
import HistoryPanel from '@/components/HistoryPanel'
import { VoicesConfig, Speaker, GenerateResult } from '@/types/dialogue'
import { callHFSpace } from '@/lib/hf-api'

const DEFAULT_VOICES: VoicesConfig = {
  nl_BE: {
    name: 'Flamand (Belgique)',
    voices: [
      { id: 'nl_BE-nathalie-medium', label: 'Nathalie', gender: 'féminin' },
      { id: 'nl_BE-rdh-medium', label: 'Rdh', gender: 'masculin' },
    ],
  },
}

export default function Home() {
  const [voices, setVoices] = useState<VoicesConfig>(DEFAULT_VOICES)
  const [locale, setLocale] = useState('nl_BE')
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { label: 'A', voice: 'nl_BE-nathalie-medium', color: '#3B82F6' },
    { label: 'B', voice: 'nl_BE-rdh-medium', color: '#EF4444' },
  ])
  const [script, setScript] = useState('A: Goedemorgen!\nB: Goedemorgen! Hoe gaat het?\nA: Het gaat goed, dank je.')
  const [silenceMs, setSilenceMs] = useState(500)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/voices')
      .then(r => r.json())
      .then(data => { if (data && !data.error) setVoices(data) })
      .catch(() => {})
  }, [])

  // When locale changes, reassign voices to speakers
  useEffect(() => {
    const available = voices[locale]?.voices ?? []
    setSpeakers(prev => prev.map((s, i) => ({
      ...s,
      voice: available[i % available.length]?.id ?? s.voice,
    })))
  }, [locale, voices])

  const handleGenerate = async () => {
    setError(null)
    setResult(null)
    try {
      const res = await callHFSpace({
        script,
        speakers,
        silence_ms: silenceMs,
        item_title: `Dialogue ${locale}`,
      })
      setResult(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  const availableVoices = voices[locale]?.voices ?? []
  const canGenerate = script.trim().length > 0 && speakers.length >= 2

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dialogue Audio</h1>
        <p className="text-gray-500 text-sm mt-1">
          Génération de dialogues audio multivoix pour l&apos;enseignement
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {/* Step 1 */}
        <div className="mb-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">
          Étape 1 — Langue
        </div>
        <LanguageSelector voices={voices} selected={locale} onChange={setLocale} />

        {/* Step 2 */}
        <div className="mb-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">
          Étape 2 — Locuteurs
        </div>
        <SpeakerConfig
          speakers={speakers}
          availableVoices={availableVoices}
          onChange={setSpeakers}
        />

        {/* Step 3 */}
        <div className="mb-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">
          Étape 3 — Script
        </div>
        <ScriptEditor script={script} speakers={speakers} onChange={setScript} />

        {/* Silence */}
        <SilenceSlider value={silenceMs} onChange={setSilenceMs} />

        {/* Step 4 */}
        <div className="mb-3 text-xs font-semibold text-blue-600 uppercase tracking-wide">
          Étape 4 — Générer
        </div>
        <GenerateButton onGenerate={handleGenerate} disabled={!canGenerate} />

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {result && <AudioResult result={result} />}
      <HistoryPanel />
    </main>
  )
}
