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
import { VoicesConfig, Speaker, GenerateResult, GeminiVoice, GeminiSpeakerProfile } from '@/types/dialogue'
import { callHFSpace } from '@/lib/hf-api'
import GeminiConfig from '@/components/GeminiConfig'

const LS = { locale: 'da_locale', result: 'da_result' }

const DEFAULT_VOICES: VoicesConfig = {
  nl_BE: {
    name: 'Flamand (Belgique)',
    voices: [
      { id: 'nl-BE-DenaNeural', label: 'Dena', gender: 'féminin', engine: 'edge-tts' },
      { id: 'nl-BE-ArnaudNeural', label: 'Arnaud', gender: 'masculin', engine: 'edge-tts' },
      { id: 'nl-NL-ColetteNeural', label: 'Colette (NL)', gender: 'féminin',  engine: 'edge-tts' },
      { id: 'nl-NL-FennaNeural',   label: 'Fenna (NL)',   gender: 'féminin',  engine: 'edge-tts' },
      { id: 'nl-NL-MaartenNeural', label: 'Maarten (NL)', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  nl_NL: {
    name: 'Néerlandais (Pays-Bas)',
    voices: [
      { id: 'nl-NL-ColetteNeural', label: 'Colette', gender: 'féminin', engine: 'edge-tts' },
      { id: 'nl-NL-FennaNeural', label: 'Fenna', gender: 'féminin', engine: 'edge-tts' },
      { id: 'nl-NL-MaartenNeural', label: 'Maarten', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  fr_FR: {
    name: 'Français',
    voices: [
      { id: 'fr-FR-DeniseNeural', label: 'Denise', gender: 'féminin', engine: 'edge-tts' },
      { id: 'fr-FR-EloiseNeural', label: 'Eloise', gender: 'féminin', engine: 'edge-tts' },
      { id: 'fr-FR-HenriNeural', label: 'Henri', gender: 'masculin', engine: 'edge-tts' },
      { id: 'fr-FR-JeromeNeural', label: 'Jérome', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  fr_BE: {
    name: 'Français (Belgique)',
    voices: [
      { id: 'fr-BE-CharlineNeural', label: 'Charline', gender: 'féminin', engine: 'edge-tts' },
      { id: 'fr-BE-GerardNeural', label: 'Gérard', gender: 'masculin', engine: 'edge-tts' },
      { id: 'fr-FR-DeniseNeural', label: 'Denise (FR)', gender: 'féminin', engine: 'edge-tts' },
      { id: 'fr-FR-HenriNeural', label: 'Henri (FR)', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  de_DE: {
    name: 'Allemand',
    voices: [
      { id: 'de-DE-KatjaNeural', label: 'Katja', gender: 'féminin', engine: 'edge-tts' },
      { id: 'de-DE-AmalaNeural', label: 'Amala', gender: 'féminin', engine: 'edge-tts' },
      { id: 'de-DE-ConradNeural', label: 'Conrad', gender: 'masculin', engine: 'edge-tts' },
      { id: 'de-DE-BerndNeural', label: 'Bernd', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  en_GB: {
    name: 'Anglais (UK)',
    voices: [
      { id: 'en-GB-SoniaNeural', label: 'Sonia', gender: 'féminin', engine: 'edge-tts' },
      { id: 'en-GB-LibbyNeural', label: 'Libby', gender: 'féminin', engine: 'edge-tts' },
      { id: 'en-GB-RyanNeural', label: 'Ryan', gender: 'masculin', engine: 'edge-tts' },
      { id: 'en-GB-OliverNeural', label: 'Oliver', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  es_ES: {
    name: 'Espagnol',
    voices: [
      { id: 'es-ES-ElviraNeural', label: 'Elvira', gender: 'féminin', engine: 'edge-tts' },
      { id: 'es-ES-AbrilNeural', label: 'Abril', gender: 'féminin', engine: 'edge-tts' },
      { id: 'es-ES-AlvaroNeural', label: 'Álvaro', gender: 'masculin', engine: 'edge-tts' },
      { id: 'es-ES-ArnauNeural', label: 'Arnau', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
  it_IT: {
    name: 'Italien',
    voices: [
      { id: 'it-IT-ElsaNeural', label: 'Elsa', gender: 'féminin', engine: 'edge-tts' },
      { id: 'it-IT-IsabellaNeural', label: 'Isabella', gender: 'féminin', engine: 'edge-tts' },
      { id: 'it-IT-DiegoNeural', label: 'Diego', gender: 'masculin', engine: 'edge-tts' },
      { id: 'it-IT-BenignoNeural', label: 'Benigno', gender: 'masculin', engine: 'edge-tts' },
    ],
  },
}

function HelpBanner() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-4 border border-jfb-bordure bg-jfb-beige text-sm" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
      <button
        className="w-full flex justify-between items-center px-4 py-3 text-jfb-noir font-medium"
        onClick={() => setOpen(o => !o)}
      >
        <span>Mode d&apos;emploi &amp; limites</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-jfb-gris space-y-2 text-xs leading-relaxed">
          <p><strong>Dialogue / Monologue :</strong> Génère un échange entre 2 à 4 locuteurs (A, B, C, D) ou un monologue (A seul). Idéal pour des exercices de compréhension orale en classe de langue.</p>
          <p><strong>Générer le script avec l&apos;IA :</strong> Ouvre le panneau violet en étape 3, remplis le niveau, le domaine, le sujet et le nombre de répliques. Le script est généré directement dans la langue cible. <strong>Max 10 générations/heure.</strong></p>
          <p><strong>Traduction :</strong> Écris le script en français, sélectionne la langue cible (étape 1), puis clique &quot;Traduire&quot;. Utilise DeepL (haute qualité). Vérifie toujours la traduction avant de générer. <strong>Disponible dans la limite du crédit DeepL — contacte le Pôle si la limite est atteinte.</strong></p>
          <p><strong>Format du script :</strong> <strong className="text-red-700">Chaque réplique doit commencer par une lettre majuscule suivie de deux-points.</strong> Les lignes sans préfixe sont ignorées.<br />
          Dialogue : <code>A: Bonjour !</code> / <code>B: Bonjour, comment vas-tu ?</code><br />
          Monologue : <code>A: Hello.</code> / <code>A: Every weekend, I go to the bakery.</code></p>
          <p><strong>Importer Word :</strong> Extrait le texte d&apos;un .docx. Vérifie que chaque réplique commence bien par A:, B:, etc.</p>
          <p><strong>Limite serveur TTS :</strong> Le serveur traite <strong>3 minutes maximum</strong> via le proxy Vercel. Au-delà de ~60 répliques, divise le script en plusieurs parties.</p>
          <p><strong>Audio généré :</strong> Hébergé sur Internet Archive, accessible via QR code. Disponible ~10 minutes après génération.</p>
          <p><strong>Langues disponibles :</strong> néerlandais BE, néerlandais NL, français, français (Belgique), allemand, anglais (UK), espagnol. <em>Voix neurales Microsoft (Edge TTS) pour le néerlandais — 5 voix nl_BE (Dena, Arnaud, Colette NL ♭, Fenna NL ♯, Maarten NL), 3 voix nl_NL (Colette, Fenna, Maarten). Voix fr (Belgique) = accent neutre France.</em> Pour toute demande : <a href="mailto:jeanfrancois.beguin@ens.ecl.be" className="underline">jeanfrancois.beguin@ens.ecl.be</a></p>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [voices, setVoices] = useState<VoicesConfig>(DEFAULT_VOICES)
  const [locale, setLocale] = useState('nl_BE')
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { label: 'A', voice: 'nl-BE-DenaNeural', color: '#3B82F6' },
    { label: 'B', voice: 'nl-BE-ArnaudNeural', color: '#EF4444' },
  ])
  const [script, setScript] = useState('A: Goedemorgen!\nB: Goedemorgen! Hoe gaat het?\nA: Het gaat goed, dank je.')
  const [silenceMs, setSilenceMs] = useState(500)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [azureConfigured, setAzureConfigured] = useState<boolean | null>(null)
  const [engine, setEngine] = useState<'edge-tts' | 'gemini'>('edge-tts')
  const [geminiConfigured, setGeminiConfigured] = useState(false)
  const [geminiVoices, setGeminiVoices] = useState<GeminiVoice[]>([])
  const [geminiProfiles, setGeminiProfiles] = useState<GeminiSpeakerProfile[]>([])
  const [ambient, setAmbient] = useState('')
  const [ambientIntensity, setAmbientIntensity] = useState(0)

  useEffect(() => {
    fetch('/api/voices')
      .then(r => r.json())
      .then(data => { if (data && !data.error) setVoices(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/azure-status')
      .then(r => r.json())
      .then(data => setAzureConfigured(data.configured ?? false))
      .catch(() => setAzureConfigured(false))
  }, [])

  useEffect(() => {
    fetch('/api/gemini-status')
      .then(r => r.json())
      .then(data => {
        setGeminiConfigured(data.configured ?? false)
        if (data.voices?.length) setGeminiVoices(data.voices)
      })
      .catch(() => {})
  }, [])

  // Sync geminiProfiles when speakers change
  useEffect(() => {
    setGeminiProfiles(prev => speakers.map(spk => {
      const existing = prev.find(p => p.label === spk.label)
      return existing ?? {
        label: spk.label, voice: geminiVoices[0]?.id ?? 'Aoede',
        name: '', age: '', role: '', nativeLanguage: '', personality: '', style: ''
      }
    }))
  }, [speakers, geminiVoices])

  // Restore locale + result from localStorage on mount (not script — fresh start)
  useEffect(() => {
    try {
      const l = localStorage.getItem(LS.locale)
      const r = localStorage.getItem(LS.result)
      if (l) setLocale(l)
      if (r) setResult(JSON.parse(r))
    } catch {}
  }, [])

  useEffect(() => { try { localStorage.setItem(LS.locale, locale) } catch {} }, [locale])

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
    try { localStorage.removeItem(LS.result) } catch {}
    try {
      let res: GenerateResult
      if (engine === 'gemini') {
        const body = {
          script,
          language: locale,
          speakers: geminiProfiles,
          ambient,
          ambient_intensity: ambientIntensity,
          item_title: `Dialogue ${locale}`,
        }
        const r = await fetch('/api/generate-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? `Erreur Gemini ${r.status}`)
        res = data
      } else {
        const enrichedSpeakers = speakers.map(sp => {
          const voiceInfo = availableVoices.find(v => v.id === sp.voice)
          return {
            ...sp,
            length_scale: voiceInfo?.length_scale ?? 1.0,
            engine: voiceInfo?.engine ?? (sp.voice.includes('Neural') ? 'edge-tts' : 'piper'),
          }
        })
        res = await callHFSpace({
          script, speakers: enrichedSpeakers, silence_ms: silenceMs,
          item_title: `Dialogue ${locale}`,
        })
      }
      setResult(res)
      try { localStorage.setItem(LS.result, JSON.stringify({ ...res, audio_data: undefined })) } catch {}
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  const availableVoices = voices[locale]?.voices ?? []
  const canGenerate = script.trim().length > 0 && speakers.length >= 2
  const hasAzureVoice = speakers.some(sp => {
    const v = availableVoices.find(v => v.id === sp.voice)
    return v?.engine === 'azure'
  })

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-jfb-noir">Dialogue Audio</h1>
        <p className="text-jfb-gris text-sm mt-1">
          Génération de dialogues audio multivoix — avec assistant IA contextuel
        </p>
      </div>

      <HelpBanner />

      <div className="bg-white border border-jfb-bordure p-6" style={{ borderRadius: '2px' }}>
        <div className="mb-2 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Étape 1 — Langue</div>
        <LanguageSelector voices={voices} selected={locale} onChange={setLocale} />

        <div className="mb-3 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Étape 2 — Moteur vocal</div>
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => setEngine('edge-tts')}
            className={`flex-1 py-2 text-sm font-medium border transition-colors ${engine === 'edge-tts' ? 'bg-jfb-noir text-white border-jfb-noir' : 'bg-white text-jfb-gris border-jfb-bordure hover:border-jfb-noir'}`}
            style={{ borderRadius: '2px' }}
          >
            Edge TTS <span className="text-[10px] opacity-70">— sans inscription</span>
          </button>
          <button
            onClick={() => setEngine('gemini')}
            className={`flex-1 py-2 text-sm font-medium border transition-colors ${engine === 'gemini' ? 'bg-jfb-rose text-white border-jfb-rose' : 'bg-white text-jfb-gris border-jfb-bordure hover:border-jfb-rose'} ${!geminiConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ borderRadius: '2px' }}
            disabled={!geminiConfigured}
            title={!geminiConfigured ? 'Gemini TTS non configuré sur le serveur' : ''}
          >
            Gemini TTS <span className="text-[10px] opacity-70">{geminiConfigured ? '— clé PLAI' : '— non disponible'}</span>
          </button>
        </div>
        <div className="mb-4 text-[11px] text-jfb-gris border border-jfb-bordure bg-jfb-subtil" style={{ borderRadius: '2px' }}>
          <div className="grid grid-cols-3 border-b border-jfb-bordure">
            <div className="px-3 py-2 font-semibold text-jfb-noir"></div>
            <div className={`px-3 py-2 font-semibold text-center ${engine === 'edge-tts' ? 'text-jfb-noir bg-white' : ''}`}>Edge TTS</div>
            <div className={`px-3 py-2 font-semibold text-center ${engine === 'gemini' ? 'text-jfb-rose bg-white' : ''}`}>Gemini TTS</div>
          </div>
          {[
            ['Voix', 'Neurales Microsoft', 'Génératives Google'],
            ['Personnages', 'Voix brutes — aucun profil', 'Nom, âge, rôle, langue maternelle, personnalité'],
            ['Ambiance sonore', '—', 'Oui (description + intensité)'],
            ['Script IA', 'Générique', 'Adapté aux profils des personnages'],
            ['Quota', 'Illimité', '1 500/jour · 15/minute'],
          ].map(([label, edge, gemini]) => (
            <div key={label} className="grid grid-cols-3 border-b border-jfb-bordure last:border-0">
              <div className="px-3 py-1.5 font-medium text-jfb-noir">{label}</div>
              <div className={`px-3 py-1.5 text-center ${engine === 'edge-tts' ? 'bg-white' : ''}`}>{edge}</div>
              <div className={`px-3 py-1.5 text-center ${engine === 'gemini' ? 'bg-white text-jfb-noir' : ''}`}>{gemini}</div>
            </div>
          ))}
        </div>

        <div className="mb-2 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Étape 3 — Locuteurs</div>
        {engine === 'edge-tts' ? (
          <>
            <SpeakerConfig speakers={speakers} availableVoices={availableVoices} onChange={setSpeakers} />
            {hasAzureVoice && azureConfigured === false && (
              <div className="mt-2 mb-1 text-xs bg-jfb-beige border border-jfb-beige-dk text-jfb-gris px-3 py-2" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
                Une ou plusieurs voix sélectionnées nécessitent Azure TTS (non configuré). La génération échouera pour ces locuteurs. Contactez le Pôle PLAI pour activer les voix néerlandaises (NL).
              </div>
            )}
          </>
        ) : (
          <GeminiConfig
            speakers={speakers}
            geminiVoices={geminiVoices}
            profiles={geminiProfiles}
            ambient={ambient}
            ambientIntensity={ambientIntensity}
            onProfilesChange={setGeminiProfiles}
            onAmbientChange={setAmbient}
            onAmbientIntensityChange={setAmbientIntensity}
          />
        )}

        <div className="mb-2 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Étape 4 — Script</div>
        <ScriptGenerator locale={locale} speakerCount={speakers.length} onGenerated={setScript} engine={engine} geminiProfiles={geminiProfiles} />
        <ScriptEditor script={script} speakers={speakers} targetLocale={locale} onChange={setScript} />

        {engine === 'edge-tts' && <SilenceSlider value={silenceMs} onChange={setSilenceMs} />}

        <div className="mb-3 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Étape 5 — Générer</div>
        <div className="mb-3 text-xs text-jfb-gris bg-jfb-subtil border border-jfb-bordure px-3 py-2 leading-relaxed" style={{ borderRadius: '2px' }}>
          L&apos;audio généré est hébergé publiquement sur Internet Archive. Ne pas inclure de données personnelles (noms d&apos;élèves, informations privées) dans le script.
        </div>
        <GenerateButton onGenerate={handleGenerate} disabled={!canGenerate} />

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2" style={{ borderRadius: '2px' }}>
            {error}
          </div>
        )}
      </div>

      {result && <AudioResult result={result} />}
      <HistoryPanel />

      <div className="mt-8 border border-jfb-bordure bg-jfb-beige p-5" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
        <h2 className="text-sm font-bold text-jfb-noir mb-1">Ancrage scientifique</h2>
        <p className="text-xs text-jfb-gris mb-3">
          Deux axes documentés dans le corpus RISS (522 627 articles scientifiques francophones) :
          l&apos;efficacité des dialogues audio pour l&apos;acquisition en LVE, et l&apos;importance de
          contextualiser l&apos;apprentissage dans le domaine professionnel pour donner du sens et motiver.
        </p>
        <p className="text-xs font-semibold text-jfb-rose mb-1 uppercase tracking-[0.12em]">Axe 1 — Dialogues audio et acquisition en LVE</p>
        <ul className="space-y-2 text-xs text-jfb-noir mb-4">
          <li><strong>Écoute-acquisition</strong> — L&apos;écoute orientée vers la production favorise l&apos;ancrage lexical et phonologique, au-delà de la simple écoute-compréhension.<span className="block text-jfb-gris-cl mt-0.5">Évrard, 2017 · RISS dumas-01760327</span></li>
          <li><strong>Familiarisation phonologique</strong> — Exposer l&apos;oreille à des sonorités et rythmes nouveaux est une priorité de l&apos;enseignement des LVE.<span className="block text-jfb-gris-cl mt-0.5">Bazelaire, 2012 · RISS dumas-00765301</span></li>
          <li><strong>Document sonore en classe</strong> — Les activités de pré- et post-écoute autour d&apos;un document sonore structurent les transactions didactiques en classe de langue.<span className="block text-jfb-gris-cl mt-0.5">Forest &amp; Gruson, 2011 · RISS hal-04050423</span></li>
          <li><strong>Prosodie et compréhension L2</strong> — L&apos;entraînement répété à l&apos;écoute de dialogues structurés réduit les obstacles prosodiques en L2.<span className="block text-jfb-gris-cl mt-0.5">Bidenti, 2024 · RISS dumas-04828505</span></li>
          <li><strong>Acquisition lexicale</strong> — Une exposition sonore structurée et répétée améliore l&apos;acquisition du lexique en L2.<span className="block text-jfb-gris-cl mt-0.5">Jouannaud, 2021 · RISS tel-03235381</span></li>
        </ul>
        <p className="text-xs font-semibold text-jfb-rose mb-1 uppercase tracking-[0.12em]">Axe 2 — Contextualisation et motivation en filière professionnelle</p>
        <ul className="space-y-2 text-xs text-jfb-noir">
          <li><strong>Contextualisation en lycée professionnel</strong> — Ancrer les apprentissages dans la filière métier est un moyen efficient de mobiliser les apprenants.<span className="block text-jfb-gris-cl mt-0.5">Payet, 2022 · RISS dumas-03984644</span></li>
          <li><strong>Langue sur objectifs spécifiques</strong> — L&apos;ancrage dans le domaine professionnel réel rend le curriculum plus opérationnel et l&apos;apprentissage plus signifiant.<span className="block text-jfb-gris-cl mt-0.5">Sowa, 2022 · RISS W4225401879</span></li>
          <li><strong>Motivation intrinsèque</strong> — L&apos;intérêt attribué à une tâche et son ancrage situationnel sont des leviers directs de motivation intrinsèque en LVE.<span className="block text-jfb-gris-cl mt-0.5">Desaivres &amp; Davoli, 2025 · RISS dumas-05216415</span></li>
          <li><strong>Productions concrètes et engagement</strong> — La dimension contextualisée des productions est un levier de motivation spécifique aux élèves de lycée professionnel.<span className="block text-jfb-gris-cl mt-0.5">Eucat, Khadraoui &amp; Dahman, 2023 · RISS dumas-04676095</span></li>
          <li><strong>Dimension professionnelle en cours de langue</strong> — Intégrer le contexte métier dans un cours de LVE a un effet positif sur l&apos;engagement et la valorisation des compétences.<span className="block text-jfb-gris-cl mt-0.5">Leglinel Conti, 2021 · RISS dumas-03699714</span></li>
        </ul>
        <p className="mt-3 text-xs text-jfb-gris-cl italic">Sources vérifiées dans le corpus RISS — 522 627 articles scientifiques francophones.</p>
      </div>
    </main>
  )
}
