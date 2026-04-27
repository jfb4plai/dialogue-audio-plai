'use client'
import { useEffect, useState } from 'react'
import LanguageSelector from '@/components/LanguageSelector'
import SpeakerConfig from '@/components/SpeakerConfig'
import ScriptEditor from '@/components/ScriptEditor'
import SilenceSlider from '@/components/SilenceSlider'
import GenerateButton from '@/components/GenerateButton'
import AudioResult from '@/components/AudioResult'
import HistoryPanel from '@/components/HistoryPanel'
import ScriptGenerator from '@/components/ScriptGenerator'
import { VoicesConfig, Speaker, GenerateResult } from '@/types/dialogue'
import { callHFSpace, callHFSpaceDirect, wakeHFSpace } from '@/lib/hf-api'

const LS = { script: 'da_script', locale: 'da_locale', mode: 'da_mode', result: 'da_result', podcast: 'da_podcast' }

const DEFAULT_VOICES: VoicesConfig = {
  nl_BE: {
    name: 'Flamand (Belgique)',
    voices: [
      { id: 'nl_BE-nathalie-medium', label: 'Nathalie', gender: 'féminin' },
      { id: 'nl_BE-rdh-medium', label: 'Rdh', gender: 'masculin' },
    ],
  },
  es_ES: {
    name: 'Espagnol',
    voices: [
      { id: 'es_ES-carlfm-x_low', label: 'Carlos', gender: 'masculin' },
      { id: 'es_MX-ald-medium', label: 'Aldo', gender: 'masculin' },
    ],
  },
  fr_BE: {
    name: 'Français (Belgique)',
    voices: [
      { id: 'fr_FR-siwis-medium', label: 'Sylvie', gender: 'féminin' },
      { id: 'fr_FR-gilles-low', label: 'Gilles', gender: 'masculin' },
    ],
  },
}

// ── Podcast multi-episode split ──────────────────────────────────────────────

const EPISODE_CONNECTORS: Record<string, { closing: string; opening: string }> = {
  nl_BE: {
    closing: 'Tot hier voor vandaag. In het volgende deel gaan we verder met dit onderwerp. Tot binnenkort!',
    opening: 'Welkom terug bij onze podcast. We vervolgen ons gesprek waar we gebleven waren.',
  },
  nl_NL: {
    closing: 'Tot hier voor vandaag. In de volgende aflevering gaan we verder. Tot ziens!',
    opening: 'Welkom terug. We gaan verder waar we gebleven waren.',
  },
  fr_FR: {
    closing: "C'est tout pour cet épisode. Suite au prochain ! À très bientôt.",
    opening: "Bienvenue dans la suite de notre podcast. Reprenons là où nous nous étions arrêtés.",
  },
  fr_BE: {
    closing: "C'est tout pour cet épisode. La suite au prochain ! À très bientôt.",
    opening: "Bienvenue dans la suite. Reprenons là où nous nous étions arrêtés.",
  },
  de_DE: {
    closing: 'Das war es für heute. Im nächsten Teil geht es weiter. Bis bald!',
    opening: 'Willkommen zurück. Setzen wir unser Gespräch dort fort, wo wir aufgehört haben.',
  },
  en_GB: {
    closing: "That's all for today. We'll continue in our next episode. See you soon!",
    opening: "Welcome back to our podcast. Let's pick up where we left off.",
  },
  es_ES: {
    closing: '¡Hasta aquí el episodio de hoy! Continuaremos en el próximo. ¡Hasta pronto!',
    opening: 'Bienvenido de vuelta. Continuemos donde lo dejamos.',
  },
}

function splitPodcastScript(script: string, locale: string, maxPerEpisode = 50): string[] {
  const lines = script.split('\n').filter(l => /^[A-B]:\s/.test(l.trim()))
  if (lines.length <= maxPerEpisode) return [script]
  const conn = EPISODE_CONNECTORS[locale] ?? EPISODE_CONNECTORS['fr_FR']
  const episodes: string[] = []
  let i = 0
  while (i < lines.length) {
    const chunk = lines.slice(i, i + maxPerEpisode)
    const isLast = i + maxPerEpisode >= lines.length
    const isFirst = i === 0
    let episodeLines = [...chunk]
    if (!isLast) episodeLines.push(`A: ${conn.closing}`)
    if (!isFirst) episodeLines = [`A: ${conn.opening}`, ...episodeLines]
    episodes.push(episodeLines.join('\n'))
    i += maxPerEpisode
  }
  return episodes
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
          <p><strong>💬 Mode Dialogue / Monologue :</strong> Génère un échange entre 2 à 4 locuteurs (A, B, C, D) ou un monologue (A seul). Idéal pour des exercices de compréhension orale en classe de langue.</p>
          <p><strong>🎙️ Mode Podcast :</strong> Génère un podcast entre une animatrice (A) et un(e) expert(e) (B) dans la langue cible. Tu peux fournir un texte source (article, document) comme base de contenu. La génération audio peut prendre <strong>1 à 3 min par épisode</strong>. Le script est éditable avant de lancer l&apos;audio. <strong>Scripts &gt; 50 répliques → découpés automatiquement en épisodes de 50 max (jusqu&apos;à 3 épisodes). Chaque épisode inclut une phrase de clôture et une phrase d&apos;intro au suivant.</strong></p>
          <p><strong>✨ Générer le script avec l&apos;IA :</strong> Ouvre le panneau coloré en étape 3, remplis le niveau, le domaine, le sujet et le nombre de répliques. Le script est généré directement dans la langue cible. <strong>Max 10 générations/heure.</strong></p>
          <p><strong>Traduction :</strong> Écris le script en français, sélectionne la langue cible (étape 1), puis clique &quot;Traduire&quot;. Utilise DeepL (haute qualité). Vérifie toujours la traduction avant de générer. <strong>⚠ L&apos;option traduction ne sera disponible que dans la limite du crédit disponible. Si vous arrivez à dépasser la limite, contactez le Pôle.</strong></p>
          <p><strong>Format du script :</strong> <strong className="text-red-700">Chaque phrase doit commencer par une lettre majuscule suivie de deux-points.</strong> Les lignes sans préfixe sont ignorées. Rafraîchis la page pour réinitialiser le script.<br />
          Dialogue : <code>A: Bonjour !</code> / <code>B: Bonjour, comment vas-tu ?</code><br />
          Monologue : <code>A: Hello.</code> / <code>A: Every weekend, I go to the bakery.</code> — même voix, une ligne par phrase.</p>
          <p><strong>Importer Word :</strong> Extrait le texte d&apos;un .docx. Vérifie ensuite que chaque réplique commence bien par A:, B:, etc.</p>
          <p><strong>⚠ Limite serveur TTS (dialogue) :</strong> Le serveur Hugging Face traite <strong>3 minutes maximum</strong> via le proxy Vercel. Au-delà de ~60 répliques, divise en plusieurs parties. Le mode Podcast contourne cette limite en se connectant directement au serveur TTS.</p>
          <p><strong>Audio généré :</strong> Hébergé sur Internet Archive, accessible via QR code. Disponible ~10 minutes après génération.</p>
          <p><strong>Langues disponibles :</strong> néerlandais (BE), néerlandais (NL), français, français (Belgique), allemand, anglais (UK), espagnol. <em>Note : fr (Belgique) utilise des voix fr_FR — accent neutre France.</em> Pour toute demande de langue supplémentaire : <a href="mailto:jeanfrancois.beguin@ens.ecl.be" className="underline">jeanfrancois.beguin@ens.ecl.be</a></p>
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
  const [podcastResults, setPodcastResults] = useState<GenerateResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'dialogue' | 'podcast'>('dialogue')
  const [podcastProgress, setPodcastProgress] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/voices')
      .then(r => r.json())
      .then(data => { if (data && !data.error) setVoices(data) })
      .catch(() => {})
  }, [])

  // ── Restore from localStorage on mount ───────────────────────────────────────
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS.script)
      const l = localStorage.getItem(LS.locale)
      const m = localStorage.getItem(LS.mode)
      const r = localStorage.getItem(LS.result)
      const p = localStorage.getItem(LS.podcast)
      if (s) setScript(s)
      if (l) setLocale(l)
      if (m === 'dialogue' || m === 'podcast') setMode(m as 'dialogue' | 'podcast')
      if (r) setResult(JSON.parse(r))
      if (p) setPodcastResults(JSON.parse(p))
    } catch {}
  }, [])

  // ── Persist script, locale, mode ─────────────────────────────────────────────
  useEffect(() => { try { localStorage.setItem(LS.script, script) } catch {} }, [script])
  useEffect(() => { try { localStorage.setItem(LS.locale, locale) } catch {} }, [locale])
  useEffect(() => { try { localStorage.setItem(LS.mode, mode) } catch {} }, [mode])

  useEffect(() => {
    const available = voices[locale]?.voices ?? []
    setSpeakers(prev => prev.map((s, i) => ({
      ...s,
      voice: available[i % available.length]?.id ?? s.voice,
    })))
  }, [locale, voices])

  // Podcast mode: force 2 speakers only
  useEffect(() => {
    if (mode === 'podcast' && speakers.length !== 2) {
      const available = voices[locale]?.voices ?? []
      setSpeakers([
        { label: 'A', voice: available[0]?.id ?? speakers[0]?.voice, color: '#3B82F6' },
        { label: 'B', voice: available[1]?.id ?? speakers[1]?.voice ?? available[0]?.id, color: '#EF4444' },
      ])
    }
  }, [mode])

  const handleGenerate = async () => {
    setError(null)
    setResult(null)
    setPodcastResults([])
    try { localStorage.removeItem(LS.result); localStorage.removeItem(LS.podcast) } catch {}
    try {
      const res = await callHFSpace({
        script, speakers, silence_ms: silenceMs,
        item_title: `Dialogue ${locale}`,
      })
      setResult(res)
      try { localStorage.setItem(LS.result, JSON.stringify({ ...res, audio_data: undefined })) } catch {}
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  const handleGeneratePodcast = async () => {
    setError(null)
    setResult(null)
    setPodcastResults([])
    try { localStorage.removeItem(LS.result); localStorage.removeItem(LS.podcast) } catch {}
    // Wake up HF Space before starting (handles cold-start 503)
    try {
      setPodcastProgress('Vérification du serveur TTS...')
      await wakeHFSpace(msg => setPodcastProgress(msg))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Serveur TTS indisponible')
      setPodcastProgress(null)
      return
    }

    const episodes = splitPodcastScript(script, locale)
    const total = episodes.length
    const allResults: GenerateResult[] = []
    for (let i = 0; i < episodes.length; i++) {
      setPodcastProgress(total > 1
        ? `Épisode ${i + 1}/${total} — connexion au serveur TTS...`
        : 'Connexion au serveur TTS...')
      try {
        const res = await callHFSpaceDirect({
          script: episodes[i],
          speakers,
          silence_ms: silenceMs,
          item_title: total > 1
            ? `Podcast ${locale} Ep${i + 1}/${total}`
            : `Podcast ${locale}`,
          onProgress: msg => setPodcastProgress(
            total > 1 ? `Épisode ${i + 1}/${total} — ${msg}` : msg
          ),
        })
        allResults.push(res)
      } catch (e: unknown) {
        setError(`Erreur épisode ${i + 1}/${total} : ${e instanceof Error ? e.message : 'Erreur inconnue'}`)
        break
      }
    }
    setPodcastProgress(null)
    if (allResults.length === 1) {
      setResult(allResults[0])
      try { localStorage.setItem(LS.result, JSON.stringify({ ...allResults[0], audio_data: undefined })) } catch {}
    } else if (allResults.length > 1) {
      setPodcastResults(allResults)
      try { localStorage.setItem(LS.podcast, JSON.stringify(allResults.map(r => ({ ...r, audio_data: undefined })))) } catch {}
    }
  }

  const availableVoices = voices[locale]?.voices ?? []
  const canGenerate = script.trim().length > 0 && speakers.length >= 2

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dialogue Audio</h1>
        <p className="text-gray-500 text-sm mt-1">
          Génération de dialogues audio multivoix — avec assistant IA contextuel
        </p>
      </div>

      <HelpBanner />

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {/* Step 1 */}
        <div className="mb-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">Étape 1 — Langue</div>
        <LanguageSelector voices={voices} selected={locale} onChange={setLocale} />

        {/* Step 2 */}
        <div className="mb-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">Étape 2 — Locuteurs</div>
        <SpeakerConfig speakers={speakers} availableVoices={availableVoices} onChange={setSpeakers} />

        {/* Step 3 — Mode toggle */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Étape 3 — Script</span>
          <div className="ml-auto flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode('dialogue')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${mode === 'dialogue' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              💬 Dialogue
            </button>
            <button
              onClick={() => setMode('podcast')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${mode === 'podcast' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🎙️ Podcast
            </button>
          </div>
        </div>

        {mode === 'podcast' && (
          <div className="mb-3 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <strong>Mode Podcast</strong> — 2 locuteurs fixes (A = animateur/trice, B = expert·e). Connexion directe au serveur TTS. <strong>Scripts &gt; 50 répliques → découpés automatiquement en épisodes.</strong>
          </div>
        )}

        <ScriptGenerator locale={locale} speakerCount={speakers.length} onGenerated={setScript} mode={mode} />
        <ScriptEditor script={script} speakers={speakers} targetLocale={locale} onChange={setScript} />

        <SilenceSlider value={silenceMs} onChange={setSilenceMs} />

        {/* Step 4 */}
        <div className="mb-3 text-xs font-semibold text-blue-600 uppercase tracking-wide">Étape 4 — Générer</div>

        {mode === 'podcast' ? (
          <div>
            <button
              onClick={handleGeneratePodcast}
              disabled={!canGenerate || !!podcastProgress}
              className="w-full py-3 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {podcastProgress ? (
                <><span className="animate-spin">⏳</span> {podcastProgress}</>
              ) : '🎙️ Générer le podcast audio'}
            </button>
            {podcastProgress && (
              <p className="text-xs text-orange-600 mt-2 text-center">
                Patience — un podcast de 8-12 min peut prendre 1 à 3 minutes à générer.
              </p>
            )}
          </div>
        ) : (
          <GenerateButton onGenerate={handleGenerate} disabled={!canGenerate} />
        )}

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {podcastResults.length > 0 && (
        <div className="mt-6 space-y-6">
          {podcastResults.map((r, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-orange-700">🎙️ Épisode {i + 1}/{podcastResults.length}</span>
                <span className="text-xs text-gray-400">— {r.duration_seconds}s</span>
              </div>
              <AudioResult result={r} />
            </div>
          ))}
        </div>
      )}
      {result && podcastResults.length === 0 && <AudioResult result={result} />}
      <HistoryPanel />

      {/* Ancrage scientifique */}
      <div className="mt-8 border border-blue-100 rounded-2xl bg-blue-50 p-5">
        <h2 className="text-sm font-bold text-blue-800 mb-1">Ancrage scientifique</h2>
        <p className="text-xs text-blue-700 mb-3">
          Deux axes documentés dans le corpus RISS (522 627 articles scientifiques francophones) :
          l&apos;efficacité des dialogues audio pour l&apos;acquisition en LVE, et l&apos;importance de
          contextualiser l&apos;apprentissage dans le domaine professionnel pour donner du sens et motiver.
        </p>
        <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Axe 1 — Dialogues audio et acquisition en LVE</p>
        <ul className="space-y-2 text-xs text-blue-900 mb-4">
          <li><strong>Écoute-acquisition</strong> — L&apos;écoute orientée vers la production favorise l&apos;ancrage lexical et phonologique, au-delà de la simple écoute-compréhension.<span className="block text-blue-500 mt-0.5">Évrard, 2017 · RISS dumas-01760327</span></li>
          <li><strong>Familiarisation phonologique</strong> — Exposer l&apos;oreille à des sonorités et rythmes nouveaux est une priorité de l&apos;enseignement des LVE.<span className="block text-blue-500 mt-0.5">Bazelaire, 2012 · RISS dumas-00765301</span></li>
          <li><strong>Document sonore en classe</strong> — Les activités de pré- et post-écoute autour d&apos;un document sonore structurent les transactions didactiques en classe de langue.<span className="block text-blue-500 mt-0.5">Forest &amp; Gruson, 2011 · RISS hal-04050423</span></li>
          <li><strong>Prosodie et compréhension L2</strong> — L&apos;entraînement répété à l&apos;écoute de dialogues structurés réduit les obstacles prosodiques en L2.<span className="block text-blue-500 mt-0.5">Bidenti, 2024 · RISS dumas-04828505</span></li>
          <li><strong>Acquisition lexicale</strong> — Une exposition sonore structurée et répétée améliore l&apos;acquisition du lexique en L2.<span className="block text-blue-500 mt-0.5">Jouannaud, 2021 · RISS tel-03235381</span></li>
        </ul>
        <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Axe 2 — Contextualisation et motivation en filière professionnelle</p>
        <ul className="space-y-2 text-xs text-blue-900">
          <li><strong>Contextualisation en lycée professionnel</strong> — Ancrer les apprentissages dans la filière métier est un moyen efficient de mobiliser les apprenants.<span className="block text-blue-500 mt-0.5">Payet, 2022 · RISS dumas-03984644</span></li>
          <li><strong>Langue sur objectifs spécifiques</strong> — L&apos;ancrage dans le domaine professionnel réel rend le curriculum plus opérationnel et l&apos;apprentissage plus signifiant.<span className="block text-blue-500 mt-0.5">Sowa, 2022 · RISS W4225401879</span></li>
          <li><strong>Motivation intrinsèque</strong> — L&apos;intérêt attribué à une tâche et son ancrage situationnel sont des leviers directs de motivation intrinsèque en LVE.<span className="block text-blue-500 mt-0.5">Desaivres &amp; Davoli, 2025 · RISS dumas-05216415</span></li>
          <li><strong>Productions concrètes et engagement</strong> — La dimension contextualisée des productions est un levier de motivation spécifique aux élèves de lycée professionnel.<span className="block text-blue-500 mt-0.5">Eucat, Khadraoui &amp; Dahman, 2023 · RISS dumas-04676095</span></li>
          <li><strong>Dimension professionnelle en cours de langue</strong> — Intégrer le contexte métier dans un cours de LVE a un effet positif sur l&apos;engagement et la valorisation des compétences.<span className="block text-blue-500 mt-0.5">Leglinel Conti, 2021 · RISS dumas-03699714</span></li>
        </ul>
        <p className="mt-3 text-xs text-blue-400 italic">Sources vérifiées dans le corpus RISS — 522 627 articles scientifiques francophones.</p>
      </div>
    </main>
  )
}
