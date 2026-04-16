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

function HelpBanner() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-4 border border-amber-200 rounded-xl bg-amber-50 text-sm">
      <button
        className="w-full flex justify-between items-center px-4 py-3 text-amber-800 font-medium"
        onClick={() => setOpen(o => !o)}
      >
        <span>Mode d&apos;emploi &amp; limites</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-amber-900 space-y-2 text-xs leading-relaxed">
          <p><strong>Format du script :</strong> Une réplique par ligne, préfixée par une lettre majuscule et deux-points.<br />
          Exemple : <code>A: Bonjour !</code> · <code>B: Bonjour, comment vas-tu ?</code></p>
          <p><strong>Locuteurs :</strong> 2 à 4 (A, B, C, D). Chaque lettre correspond à une voix distincte.</p>
          <p><strong>Importer Word :</strong> Le bouton &quot;Importer Word&quot; extrait le texte d&apos;un fichier .docx. Vérifie ensuite que chaque réplique commence bien par A:, B:, etc.</p>
          <p><strong>Traduction :</strong> Écris le script en français, sélectionne la langue cible (étape 1), puis clique &quot;Traduire&quot;. Utilise LibreTranslate (open source). Vérifie toujours la traduction avant de générer.</p>
          <p><strong>⚠ Limite serveur :</strong> Le serveur TTS gratuit (Hugging Face Space) traite les requêtes pendant <strong>3 minutes maximum</strong>. Au-delà de ~60 répliques, le timeout est probable. Pour des dialogues longs, divise en plusieurs parties.</p>
          <p><strong>Audio généré :</strong> Hébergé sur Internet Archive (archive.org), accessible via QR code. Disponible ~10 minutes après génération (délai de traitement IA).</p>
          <details className="mt-3">
            <summary className="cursor-pointer font-semibold text-amber-800">Pourquoi l&apos;audio en cours de langue ? — Références RISS</summary>
            <div className="mt-2 space-y-2 text-xs text-amber-900 border-t border-amber-200 pt-2">
              <p>L&apos;exposition à des documents sonores authentiques est un levier central de l&apos;acquisition en langue vivante étrangère. Plusieurs axes sont documentés dans la littérature scientifique francophone :</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Écoute-acquisition</strong> : l&apos;écoute orientée vers la production (listening-as-acquisition) favorise l&apos;ancrage lexical et phonologique, distinctement de la simple écoute-compréhension (Évrard, 2017 — <em>Plus-value du visuel en CO LV1 anglais</em>, RISS dumas-01760327).</li>
                <li><strong>Familiarisation phonologique</strong> : exposer l&apos;oreille à des sonorités et rythmes nouveaux est une priorité pour l&apos;enseignement des LVE, notamment au primaire (Bazelaire, 2012 — <em>Jeu et perspective actionnelle en LVE</em>, RISS dumas-00765301).</li>
                <li><strong>Document sonore en classe</strong> : les activités de pré-écoute et post-écoute autour d&apos;un document sonore structurent les transactions didactiques en classe de langue (Forest &amp; Gruson, 2011 — <em>Gestion de l&apos;espace en classe de langues</em>, RISS hal-04050423).</li>
                <li><strong>Prosodie et compréhension L2</strong> : les obstacles prosodiques (rythme, intonation) constituent un frein majeur à la compréhension orale en L2 ; l&apos;entraînement répété à l&apos;écoute de dialogues permet de les réduire (Bidenti, 2024 — <em>Obstacle prosodique CO italien L2</em>, RISS dumas-04828505).</li>
                <li><strong>Remédiation aurale</strong> : un diagnostic ciblé sur la compréhension aurale, combiné à une exposition sonore structurée, améliore l&apos;acquisition du lexique en L2 (Jouannaud, 2021 — <em>Remédiation — compréhension aurale anglais</em>, RISS tel-03235381).</li>
              </ul>
              <p className="text-amber-700 italic">Sources vérifiées dans le corpus RISS (522 627 articles scientifiques francophones).</p>
            </div>
          </details>
        </div>
      )}
    </div>
  )
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

      <HelpBanner />

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
        <ScriptEditor script={script} speakers={speakers} targetLocale={locale} onChange={setScript} />

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
