'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/lib/wizard-context'
import { SPEAKER_COLORS, DEFAULT_VOICES } from '@/lib/voices'
import { Speaker, GeminiSpeakerProfile } from '@/types/dialogue'
import LanguageSelector from '@/components/LanguageSelector'
import SpeakerConfig from '@/components/SpeakerConfig'
import GeminiConfig from '@/components/GeminiConfig'
import SilenceSlider from '@/components/SilenceSlider'
import { getEdgeMultiVoicesForLocale } from '@/lib/voice-routing'

const LABELS = ['A', 'B', 'C', 'D']

export default function ConfigPage() {
  const { state, dispatch, isHydrated } = useWizard()
  const router = useRouter()
  const { mode, locale, niveau, engine, speakers, voices, geminiVoices, elevenlabsVoices, geminiProfiles, ambient, ambientIntensity, silenceMs } = state

  // Garde-fou : attend la hydratation sessionStorage avant de vérifier le mode
  useEffect(() => {
    if (isHydrated && !mode) router.replace('/studio/type')
  }, [isHydrated, mode, router])

  // Fetch voix depuis l'API au montage (avec fallback DEFAULT_VOICES)
  useEffect(() => {
    fetch('/api/voices')
      .then(r => r.json())
      .then(data => { if (data && !data.error) dispatch({ type: 'SET_VOICES', payload: data }) })
      .catch(() => {})
  }, [dispatch])

  // Fetch voix Gemini si pas encore chargées
  useEffect(() => {
    if (geminiVoices.length > 0) return
    fetch('/api/gemini-status')
      .then(r => r.json())
      .then(data => {
        if (data.voices?.length) dispatch({ type: 'SET_GEMINI_VOICES', payload: data.voices })
      })
      .catch(() => {})
  }, [geminiVoices.length, dispatch])

  // Fetch voix ElevenLabs si pas encore chargées
  useEffect(() => {
    if (elevenlabsVoices.length > 0) return
    fetch('/api/elevenlabs-status')
      .then(r => r.json())
      .then(data => {
        if (data.voices?.length) dispatch({ type: 'SET_ELEVENLABS_VOICES', payload: data.voices })
      })
      .catch(() => {})
  }, [elevenlabsVoices.length, dispatch])

  // Sync voix des locuteurs quand locale change
  // Ne remplace la voix d'un locuteur que si elle n'est plus disponible dans la nouvelle locale
  useEffect(() => {
    const available = voices[locale]?.voices ?? []
    if (!available.length) return
    const availableIds = new Set(available.map(v => v.id))
    const needsUpdate = speakers.some(s => !availableIds.has(s.voice))
    if (!needsUpdate) return
    dispatch({
      type: 'SET_SPEAKERS',
      payload: speakers.map((s, i) => ({
        ...s,
        voice: availableIds.has(s.voice)
          ? s.voice
          : (available[i % available.length]?.id ?? s.voice),
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, voices])

  // Sync geminiProfiles quand speakers / locale / voix disponibles changent.
  // Règle : 2 locuteurs → Gemini ; 3-4 → Edge TTS si assez de voix, sinon ElevenLabs.
  // Si le locuteur existait avec une voix incompatible avec le nouveau mode, on la remplace.
  useEffect(() => {
    const edgeVoices = speakers.length >= 3 ? getEdgeMultiVoicesForLocale(locale, speakers.length) : null
    const useEdgeMulti = edgeVoices !== null
    const useEL = speakers.length >= 3 && !useEdgeMulti && elevenlabsVoices.length > 0

    const pool = useEdgeMulti ? edgeVoices : useEL ? elevenlabsVoices : geminiVoices
    const poolIds = new Set(pool.map(v => v.id))

    dispatch({
      type: 'SET_GEMINI_PROFILES',
      payload: speakers.map((spk, i) => {
        const existing = geminiProfiles.find(p => p.label === spk.label)
        if (existing) {
          if (!poolIds.has(existing.voice)) {
            return { ...existing, voice: pool[i % pool.length]?.id ?? existing.voice }
          }
          return existing
        }
        return {
          label: spk.label,
          voice: pool[i % pool.length]?.id ?? 'Aoede',
          name: '', age: '', role: '', nativeLanguage: '', personality: '', style: '',
        }
      }),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakers, locale, geminiVoices, elevenlabsVoices])

  // Gemini est le moteur par défaut — forcer si pas encore défini
  useEffect(() => {
    if (engine !== 'gemini') {
      dispatch({ type: 'SET_ENGINE', payload: 'gemini' })
    }
  }, [mode, engine, dispatch])

  const availableVoices = voices[locale]?.voices ?? DEFAULT_VOICES[locale]?.voices ?? []

  const setSpeakers = (spks: Speaker[]) => dispatch({ type: 'SET_SPEAKERS', payload: spks })

  const addSpeaker = () => {
    if (speakers.length >= 4) return
    const label = LABELS[speakers.length]
    const available = voices[locale]?.voices ?? []
    dispatch({
      type: 'SET_SPEAKERS',
      payload: [...speakers, {
        label,
        voice: available[speakers.length % available.length]?.id ?? '',
        color: SPEAKER_COLORS[speakers.length],
      }],
    })
  }

  const removeSpeaker = () => {
    if (speakers.length <= 2) return
    dispatch({ type: 'SET_SPEAKERS', payload: speakers.slice(0, -1) })
  }

  const canContinue = speakers.length >= 2 && locale.length > 0

  const handleContinue = () => router.push('/studio/script')

  if (!isHydrated || !mode) return null

  const isPodcast = mode === 'podcast'
  const geminiConfigured = geminiVoices.length > 0

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-jfb-noir capitalize">{mode} — Configuration</h1>
        <p className="text-jfb-gris text-sm mt-1">Langue, locuteurs et moteur vocal</p>
      </div>

      <div className="bg-white border border-jfb-bordure p-6 space-y-6" style={{ borderRadius: '2px' }}>

        {/* Langue */}
        <div>
          <div className="mb-2 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Langue cible</div>
          <LanguageSelector voices={voices} selected={locale} onChange={l => dispatch({ type: 'SET_LOCALE', payload: l })} />
        </div>

        {/* Niveau CECRL */}
        <div>
          <div className="mb-2 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Niveau dans la langue-cible</div>
          <select
            value={niveau}
            onChange={e => dispatch({ type: 'SET_NIVEAU', payload: e.target.value })}
            className="w-full border border-jfb-bordure px-3 py-2 bg-white text-sm text-jfb-noir focus:outline-none focus:ring-2 focus:ring-jfb-rose"
            style={{ borderRadius: '2px' }}
          >
            <option value="">— Choisir un niveau —</option>
            <option value="A1">A1 — Débutant (mots isolés, phrases très courtes)</option>
            <option value="A2">A2 — Élémentaire (phrases simples, situations courantes)</option>
            <option value="B1">B1 — Intermédiaire (autonomie de base, sujets familiers)</option>
            <option value="B2">B2 — Avancé (fluidité, argumentation, nuances)</option>
            <option value="C1">C1 — Autonome (registres variés, spontanéité)</option>
            <option value="C2">C2 — Maîtrise (précision, subtilité, registre soutenu)</option>
          </select>
          {!niveau && (
            <p className="mt-1 text-xs text-amber-600">Ce choix influence le vocabulaire et la complexité du script généré.</p>
          )}
        </div>

        {/* Podcast : Gemini forcé */}
        {isPodcast && (
          <div className="text-sm bg-jfb-beige border border-jfb-beige-dk px-4 py-3" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
            <p className="font-semibold text-jfb-noir mb-0.5">Mode Podcast — Gemini TTS</p>
            <p className="text-xs text-jfb-gris">Profils de personnages enrichis · ambiance sonore · script depuis document. Limite 3 min en V1.</p>
            {!geminiConfigured && (
              <p className="text-xs text-red-600 mt-2 font-medium">Gemini TTS non configuré — contactez le Pôle PLAI.</p>
            )}
          </div>
        )}

        {/* Locuteurs */}
        <div>
          <div className="mb-2 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Locuteurs</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex gap-1.5">
              {speakers.map((spk, i) => (
                <span key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: SPEAKER_COLORS[i] }}>
                  {spk.label}
                </span>
              ))}
            </div>
            <div className="flex gap-2 ml-auto items-center">
              {speakers.length > 2 && (
                <button onClick={removeSpeaker}
                  className="text-xs px-2 py-1 border border-jfb-bordure text-jfb-gris hover:border-red-400 hover:text-red-500"
                  style={{ borderRadius: '2px' }}>
                  − Retirer
                </button>
              )}
              {speakers.length < 4 && (
                <button onClick={addSpeaker}
                  className="text-xs px-2 py-1 border border-jfb-bordure text-jfb-rose hover:border-jfb-rose font-medium"
                  style={{ borderRadius: '2px' }}>
                  + Ajouter
                </button>
              )}
              {speakers.length > 2 && (
                <span className="text-[10px] text-jfb-gris-cl">
                  {getEdgeMultiVoicesForLocale(locale, speakers.length)
                    ? 'Edge TTS · 3-4 locuteurs'
                    : `ElevenLabs${elevenlabsVoices.length === 0 ? ' — non configuré' : ''} · 3-4 locuteurs`}
                </span>
              )}
            </div>
          </div>

          <GeminiConfig
            locale={locale}
            speakers={speakers}
            geminiVoices={geminiVoices}
            elevenlabsVoices={elevenlabsVoices}
            profiles={geminiProfiles}
            ambient={ambient}
            ambientIntensity={ambientIntensity}
            onProfilesChange={p => dispatch({ type: 'SET_GEMINI_PROFILES', payload: p as GeminiSpeakerProfile[] })}
            onAmbientChange={a => dispatch({ type: 'SET_AMBIENT', payload: a })}
            onAmbientIntensityChange={v => dispatch({ type: 'SET_AMBIENT_INTENSITY', payload: v })}
          />
        </div>


        {/* CTA */}
        {(() => {
          const isDisabled = !canContinue || (isPodcast && !geminiConfigured)
          const missing: string[] = []
          if (!locale) missing.push('choisir une langue cible')
          if (speakers.length < 2) missing.push('ajouter au moins 2 locuteurs')
          if (isPodcast && !geminiConfigured) missing.push('configurer Gemini TTS (contactez le Pôle PLAI)')
          return (
            <div>
              <button
                onClick={handleContinue}
                disabled={isDisabled}
                className="w-full py-3 text-sm font-semibold text-white transition-colors"
                style={{
                  borderRadius: '2px',
                  backgroundColor: isDisabled ? '#5a5a5a' : '#1a1a1a',
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                Continuer vers le script →
              </button>
              {isDisabled && missing.length > 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  Pour continuer : {missing.join(' · ')}.
                </p>
              )}
            </div>
          )
        })()}
      </div>
    </main>
  )
}
