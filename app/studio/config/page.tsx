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

const LABELS = ['A', 'B', 'C', 'D']

export default function ConfigPage() {
  const { state, dispatch, isHydrated } = useWizard()
  const router = useRouter()
  const { mode, locale, engine, speakers, voices, geminiVoices, geminiProfiles, ambient, ambientIntensity, silenceMs } = state

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

  // Sync geminiProfiles quand speakers change
  useEffect(() => {
    dispatch({
      type: 'SET_GEMINI_PROFILES',
      payload: speakers.map(spk => {
        const existing = geminiProfiles.find(p => p.label === spk.label)
        return existing ?? {
          label: spk.label,
          voice: geminiVoices[0]?.id ?? 'Aoede',
          name: '', age: '', role: '', nativeLanguage: '', personality: '', style: '',
        }
      }),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakers, geminiVoices])

  // Pour podcast → forcer Gemini
  useEffect(() => {
    if (mode === 'podcast' && engine !== 'gemini') {
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

        {/* Moteur — masqué pour podcast (Gemini forcé) */}
        {!isPodcast && (
          <div>
            <div className="mb-2 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Moteur vocal</div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => dispatch({ type: 'SET_ENGINE', payload: 'edge-tts' })}
                className={`flex-1 py-2 text-sm font-medium border transition-colors ${engine === 'edge-tts' ? 'bg-jfb-noir text-white border-jfb-noir' : 'bg-white text-jfb-gris border-jfb-bordure hover:border-jfb-noir'}`}
                style={{ borderRadius: '2px' }}
              >
                Edge TTS <span className="text-[10px] opacity-70">— sans inscription</span>
              </button>
              <button
                onClick={() => geminiConfigured && dispatch({ type: 'SET_ENGINE', payload: 'gemini' })}
                disabled={!geminiConfigured}
                className={`flex-1 py-2 text-sm font-medium border transition-colors ${engine === 'gemini' ? 'bg-jfb-rose text-white border-jfb-rose' : 'bg-white text-jfb-gris border-jfb-bordure hover:border-jfb-rose'} ${!geminiConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ borderRadius: '2px' }}
                title={!geminiConfigured ? 'Gemini TTS non configuré sur le serveur' : ''}
              >
                Gemini TTS <span className="text-[10px] opacity-70">{geminiConfigured ? '— clé PLAI' : '— non disponible'}</span>
              </button>
            </div>

            {/* Tableau comparatif compact */}
            <div className="text-[11px] text-jfb-gris border border-jfb-bordure bg-jfb-subtil" style={{ borderRadius: '2px' }}>
              <div className="grid grid-cols-3 border-b border-jfb-bordure">
                <div className="px-3 py-1.5 font-semibold text-jfb-noir"></div>
                <div className={`px-3 py-1.5 font-semibold text-center ${engine === 'edge-tts' ? 'text-jfb-noir bg-white' : ''}`}>Edge TTS</div>
                <div className={`px-3 py-1.5 font-semibold text-center ${engine === 'gemini' ? 'text-jfb-rose bg-white' : ''}`}>Gemini TTS</div>
              </div>
              {[
                ['Voix',           'Neurales Microsoft',              'Génératives Google'],
                ['Personnages',    'Voix brutes',                     'Nom, âge, rôle, personnalité'],
                ['Ambiance',       '—',                               'Oui'],
                ['Script IA',      'Générique',                       'Adapté aux profils'],
                ['Quota',          'Illimité',                        '1 500/jour · 15/min'],
              ].map(([label, edge, gemini]) => (
                <div key={label} className="grid grid-cols-3 border-b border-jfb-bordure last:border-0">
                  <div className="px-3 py-1.5 font-medium text-jfb-noir">{label}</div>
                  <div className={`px-3 py-1.5 text-center ${engine === 'edge-tts' ? 'bg-white' : ''}`}>{edge}</div>
                  <div className={`px-3 py-1.5 text-center ${engine === 'gemini' ? 'bg-white text-jfb-noir' : ''}`}>{gemini}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <div className="flex gap-2 ml-auto">
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
            </div>
          </div>

          {engine === 'edge-tts' ? (
            <SpeakerConfig speakers={speakers} availableVoices={availableVoices} onChange={setSpeakers} />
          ) : (
            <GeminiConfig
              speakers={speakers}
              geminiVoices={geminiVoices}
              profiles={geminiProfiles}
              ambient={ambient}
              ambientIntensity={ambientIntensity}
              onProfilesChange={p => dispatch({ type: 'SET_GEMINI_PROFILES', payload: p as GeminiSpeakerProfile[] })}
              onAmbientChange={a => dispatch({ type: 'SET_AMBIENT', payload: a })}
              onAmbientIntensityChange={v => dispatch({ type: 'SET_AMBIENT_INTENSITY', payload: v })}
            />
          )}
        </div>

        {/* Silence (Edge uniquement) */}
        {engine === 'edge-tts' && (
          <SilenceSlider value={silenceMs} onChange={v => dispatch({ type: 'SET_SILENCE_MS', payload: v })} />
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!canContinue || (isPodcast && !geminiConfigured)}
          className="w-full py-3 text-sm font-semibold bg-jfb-noir text-white hover:bg-jfb-noir-doux disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{ borderRadius: '2px' }}
        >
          Continuer vers le script →
        </button>
      </div>
    </main>
  )
}
