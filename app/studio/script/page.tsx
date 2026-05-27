'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/lib/wizard-context'
import ScriptEditor from '@/components/ScriptEditor'
import ScriptGenerator from '@/components/ScriptGenerator'
import GenerateButton from '@/components/GenerateButton'
import { callHFSpace, callHFSpaceDirect } from '@/lib/hf-api'
import { getSupabase } from '@/lib/supabase'
import { GenerateResult } from '@/types/dialogue'

type Source = 'ai-form' | 'ai-file' | 'manual'

const EXAMPLES = [
  {
    label: 'Service client',
    script: `A: Goedemorgen! Kan ik u helpen?\nB: Ja, graag. Ik wil een kamer reserveren voor twee nachten.\nA: Natuurlijk. Welke datum heeft u in gedachten?\nB: Van de vijftiende tot de zeventiende.\nA: Perfect. Een kamer voor één persoon?\nB: Nee, voor twee personen, graag.\nA: Geen probleem. Ik reserveer dat meteen voor u.`,
  },
  {
    label: 'Au restaurant',
    script: `A: Bonsoir ! Avez-vous une réservation ?\nB: Oui, au nom de Dubois, pour deux personnes.\nA: Très bien, par ici. Voici notre carte.\nB: Merci. Qu'est-ce que vous recommandez ce soir ?\nA: Le poisson du jour est excellent. Et en entrée, notre velouté maison.\nB: Parfait. Je prends ça.`,
  },
  {
    label: 'Consultation',
    script: `A: Guten Morgen. Was kann ich für Sie tun?\nB: Ich habe seit drei Tagen Halsschmerzen.\nA: Haben Sie auch Fieber?\nB: Ja, gestern Abend hatte ich 38,5 Grad.\nA: Ich sehe mir das an. Bitte öffnen Sie den Mund.\nB: So?\nA: Gut. Ich verschreibe Ihnen ein Antibiotikum.`,
  },
]

export default function ScriptPage() {
  const { state, dispatch, isHydrated } = useWizard()
  const router = useRouter()
  const { mode, locale, niveau, engine, speakers, script, geminiProfiles, silenceMs, ambient, ambientIntensity, voices } = state

  const [source, setSource] = useState<Source>('ai-form')
  const [error, setError] = useState<string | null>(null)
  const [activeEpisodeScript, setActiveEpisodeScript] = useState<string>('')

  // File upload state (source = 'ai-file')
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Défaut source selon mode, après hydratation
  useEffect(() => {
    if (isHydrated && mode === 'podcast') setSource('ai-file')
  }, [isHydrated, mode])

  // Garde-fou
  useEffect(() => {
    if (isHydrated && !mode) router.replace('/studio/type')
  }, [isHydrated, mode, router])

  const setScript = (s: string) => dispatch({ type: 'SET_SCRIPT', payload: s })

  // Upload + parse file → AI génère le script
  const handleFileUpload = async () => {
    if (!file) return
    setParsing(true)
    setParseError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('locale', locale)
      form.append('nb_locuteurs', String(speakers.length))
      form.append('mode', mode ?? 'dialogue')
      if (niveau) form.append('niveau', niveau)
      if (engine === 'gemini' && geminiProfiles.length) {
        form.append('gemini_profiles', JSON.stringify(geminiProfiles))
      }
      const res = await fetch('/api/parse-file', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`)
      setScript(data.script)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setParsing(false)
    }
  }

  // Récupère le JWT Supabase pour associer le dialogue à l'utilisateur connecté
  const getAuthToken = async (): Promise<string | undefined> => {
    try {
      const sb = getSupabase()
      if (!sb) return undefined
      const { data: { session } } = await sb.auth.getSession()
      return session?.access_token ?? undefined
    } catch {
      return undefined
    }
  }

  // Génération audio — les erreurs remontent à GenerateButton
  const handleGenerate = async () => {
    // Use active episode script if set (multi-episode podcast), else full script
    const scriptToGenerate = activeEpisodeScript || script
    if (!scriptToGenerate.trim() || speakers.length < 2) return
    setError(null)

    const effectiveEngine = engine

    const token = await getAuthToken()

    let res: GenerateResult
    if (effectiveEngine === 'gemini') {
      const r = await fetch('/api/generate-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          script: scriptToGenerate,
          locale,
          speakers: geminiProfiles.map(p => ({
            label: p.label,
            voice: p.voice,
            name: p.name,
            age: p.age,
            role: p.role,
            native_language: p.nativeLanguage,
            personality: p.personality,
            style: p.style,
          })),
          ambient,
          ambient_intensity: ambientIntensity,
          item_title: `${mode} ${locale}`,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? `Erreur Gemini ${r.status}`)
      res = data
    } else { // effectiveEngine === 'edge-tts'
      const availableVoices = voices[locale]?.voices ?? []
      const enrichedSpeakers = speakers.map(sp => {
        const voiceInfo = availableVoices.find(v => v.id === sp.voice)
        return {
          ...sp,
          length_scale: voiceInfo?.length_scale ?? 1.0,
          engine: voiceInfo?.engine ?? (sp.voice.includes('Neural') ? 'edge-tts' : 'piper'),
        }
      })

      // Podcast : appel direct au HF Space (contourne le timeout Vercel 60s)
      // Dialogue : via proxy Vercel /api/generate
      if (mode === 'podcast') {
        res = await callHFSpaceDirect({
          script: scriptToGenerate,
          speakers: enrichedSpeakers,
          silence_ms: silenceMs,
          item_title: `${mode} ${locale}`,
        })
      } else {
        res = await callHFSpace({
          script: scriptToGenerate,
          speakers: enrichedSpeakers,
          silence_ms: silenceMs,
          item_title: `${mode} ${locale}`,
          locale,
          token,
        })
      }
    }

    // Stocker generated_at pour détecter les recharges post-génération (délai Internet Archive)
    dispatch({ type: 'SET_RESULT', payload: { ...res, generated_at: new Date().toISOString() } })
    router.push('/studio/result')
  }

  const scriptToCheck = activeEpisodeScript || script
  const canGenerate = scriptToCheck.trim().length > 0 && speakers.length >= 2

  if (!isHydrated || !mode) return null

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-jfb-noir capitalize">{mode} — Script</h1>
        <p className="text-jfb-gris text-sm mt-1">Choisissez la source du script, puis éditez avant de générer l&apos;audio</p>
      </div>

      <div className="bg-white border border-jfb-bordure p-6 space-y-5" style={{ borderRadius: '2px' }}>

        {/* Sélecteur de source */}
        <div>
          <div className="mb-2 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Source du script</div>
          <div className="flex flex-col sm:flex-row gap-2">
            {mode !== 'podcast' ? (
              <button
                onClick={() => setSource('ai-form')}
                className={`flex-1 py-2.5 px-3 text-sm font-medium border text-left transition-colors ${source === 'ai-form' ? 'bg-jfb-noir text-white border-jfb-noir' : 'bg-white text-jfb-gris border-jfb-bordure hover:border-jfb-noir'}`}
                style={{ borderRadius: '2px' }}
              >
                Générer avec l&apos;IA
                <span className="block text-[10px] opacity-70 font-normal">Formulaire guidé</span>
              </button>
            ) : (
              <div className="flex-1 py-2.5 px-3 text-sm border border-jfb-bordure bg-jfb-subtil text-jfb-gris-cl" style={{ borderRadius: '2px' }}>
                Formulaire guidé
                <span className="block text-[10px] font-normal">Non disponible en mode Podcast — utilisez un document ou saisissez directement</span>
              </div>
            )}
            <button
              onClick={() => setSource('ai-file')}
              className={`flex-1 py-2.5 px-3 text-sm font-medium border text-left transition-colors ${source === 'ai-file' ? 'bg-jfb-noir text-white border-jfb-noir' : 'bg-white text-jfb-gris border-jfb-bordure hover:border-jfb-noir'}`}
              style={{ borderRadius: '2px' }}
            >
              Générer depuis un document
              <span className="block text-[10px] opacity-70 font-normal">PDF ou Word uploadé</span>
            </button>
            <button
              onClick={() => setSource('manual')}
              className={`flex-1 py-2.5 px-3 text-sm font-medium border text-left transition-colors ${source === 'manual' ? 'bg-jfb-noir text-white border-jfb-noir' : 'bg-white text-jfb-gris border-jfb-bordure hover:border-jfb-noir'}`}
              style={{ borderRadius: '2px' }}
            >
              J&apos;ai mon script
              <span className="block text-[10px] opacity-70 font-normal">Saisir ou coller directement</span>
            </button>
          </div>
        </div>

        {/* Source : formulaire IA */}
        {source === 'ai-form' && mode !== 'podcast' && (
          <ScriptGenerator
            locale={locale}
            speakerCount={speakers.length}
            onGenerated={setScript}
            engine={engine}
            geminiProfiles={geminiProfiles}
          />
        )}

        {/* Source : fichier → IA */}
        {source === 'ai-file' && (
          <div className="border border-jfb-bordure bg-jfb-subtil p-4 space-y-3" style={{ borderRadius: '2px' }}>
            <p className="text-xs text-jfb-gris leading-relaxed">
              Téléversez un document (PDF ou Word). L&apos;IA en extrait le contenu et génère un script{' '}
              <strong>{speakers.length} locuteur{speakers.length > 1 ? 's' : ''}</strong> en{' '}
              <strong>{locale}</strong>.
            </p>
            <div className="flex gap-2 items-center">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="text-sm border border-jfb-bordure bg-white px-3 py-2 text-jfb-gris hover:border-jfb-noir hover:text-jfb-noir transition-colors"
                style={{ borderRadius: '2px' }}
              >
                {file ? file.name : 'Choisir un fichier…'}
              </button>
              {file && (
                <button
                  onClick={handleFileUpload}
                  disabled={parsing}
                  className="text-sm bg-jfb-rose text-white px-4 py-2 font-medium hover:bg-jfb-rose-dk disabled:opacity-50 transition-colors"
                  style={{ borderRadius: '2px' }}
                >
                  {parsing ? 'Analyse en cours…' : 'Générer le script'}
                </button>
              )}
            </div>
            {parseError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2" style={{ borderRadius: '2px' }}>
                {parseError}
              </p>
            )}
            <p className="text-[10px] text-jfb-gris-cl">Formats acceptés : .pdf, .doc, .docx · Max 10 MB · Max 10 générations/heure</p>
          </div>
        )}

        {/* Source : script manuel — exemples */}
        {source === 'manual' && (
          <div>
            <p className="text-[11px] text-jfb-gris mb-2">Charger un exemple :</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(t => (
                <button key={t.label} onClick={() => setScript(t.script)}
                  className="text-xs px-3 py-1.5 border border-jfb-bordure text-jfb-gris hover:border-jfb-rose hover:text-jfb-rose bg-white"
                  style={{ borderRadius: '2px' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Éditeur toujours visible */}
        <div>
          <div className="mb-2 text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Éditeur de script</div>
          <ScriptEditor
            script={script}
            speakers={speakers}
            targetLocale={locale}
            onChange={setScript}
            onActiveEpisodeChange={(epScript) => setActiveEpisodeScript(epScript)}
          />
        </div>

        {/* Notice RGPD Internet Archive */}
        <div className="text-xs text-jfb-gris bg-jfb-subtil border border-jfb-bordure px-3 py-2 leading-relaxed" style={{ borderRadius: '2px' }}>
          L&apos;audio généré est hébergé publiquement sur Internet Archive. Ne pas inclure de données personnelles (noms d&apos;élèves, informations privées) dans le script.
        </div>

        {/* Erreur génération */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2" style={{ borderRadius: '2px' }}>
            {error}
          </div>
        )}

        {/* Bouton génération audio avec feedback progressif */}
        <GenerateButton onGenerate={handleGenerate} disabled={!canGenerate} />
      </div>
    </main>
  )
}
