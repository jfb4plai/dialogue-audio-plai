'use client'
import { useState } from 'react'
import { GeminiVoice, ElevenLabsVoice, GeminiSpeakerProfile } from '@/types/dialogue'
import { Speaker } from '@/types/dialogue'
import { SPEAKER_COLORS } from '@/lib/voices'

const STYLES = [
  { value: '', label: 'Neutre (par défaut)' },
  { value: 'excited', label: 'Enthousiaste · débit rapide' },
  { value: 'hesitant', label: 'Hésitant · débit lent, pauses' },
  { value: 'cheerful', label: 'Joyeux (cheerful)' },
  { value: 'serious', label: 'Sérieux (serious)' },
  { value: 'thoughtful', label: 'Réfléchi (thoughtful)' },
  { value: 'professional', label: 'Professionnel' },
]

interface Props {
  speakers: Speaker[]
  geminiVoices: GeminiVoice[]
  elevenlabsVoices: ElevenLabsVoice[]
  profiles: GeminiSpeakerProfile[]
  ambient: string
  ambientIntensity: number
  onProfilesChange: (profiles: GeminiSpeakerProfile[]) => void
  onAmbientChange: (ambient: string) => void
  onAmbientIntensityChange: (intensity: number) => void
}

export default function GeminiConfig({
  speakers, geminiVoices, elevenlabsVoices, profiles, ambient, ambientIntensity,
  onProfilesChange, onAmbientChange, onAmbientIntensityChange
}: Props) {
  const [advanced, setAdvanced] = useState(false)

  const updateProfile = (label: string, field: keyof GeminiSpeakerProfile, value: string) => {
    onProfilesChange(profiles.map(p => p.label === label ? { ...p, [field]: value } : p))
  }

  // Mode voix : ElevenLabs si 3-4 locuteurs et configuré, sinon Gemini
  const useEL = speakers.length >= 3 && elevenlabsVoices.length > 0
  const activeVoices: GeminiVoice[] = useEL ? elevenlabsVoices : geminiVoices

  const femaleVoices = activeVoices.filter(v => v.gender === 'féminin')
  const maleVoices   = activeVoices.filter(v => v.gender === 'masculin')

  // Détection voix même genre — pour l'avertissement de différenciation
  const profileGenders = profiles.map(p => activeVoices.find(v => v.id === p.voice)?.gender)
  const hasSameGenderPair = profileGenders.filter(Boolean).some(
    (g, i) => profileGenders.some((g2, j) => i !== j && g === g2)
  )

  const inputCls = "w-full text-sm border border-jfb-bordure px-2 py-1.5 bg-white"
  const labelCls = "block text-[11px] font-medium text-jfb-gris mb-1"

  return (
    <div className="space-y-4">

      {/* Badge moteur actif */}
      {useEL ? (
        <div className="text-xs text-jfb-gris bg-jfb-subtil border border-jfb-bordure px-3 py-2 flex items-center gap-2" style={{ borderRadius: '2px' }}>
          <span className="font-semibold text-jfb-noir">ElevenLabs</span>
          <span>·</span>
          <span>Voix multilingues haute qualité · ~10 000 car./mois (plan gratuit)</span>
        </div>
      ) : (
        <div className="text-xs text-jfb-gris bg-jfb-subtil border border-jfb-bordure px-3 py-2 flex items-center gap-2" style={{ borderRadius: '2px' }}>
          <span className="font-semibold text-jfb-rose">Gemini TTS</span>
          <span>·</span>
          <span>1 appel API/dialogue · 100 générations/jour · Pas d&apos;inscription requise</span>
        </div>
      )}

      {/* Warning ElevenLabs non configuré si 3-4 locuteurs */}
      {speakers.length >= 3 && elevenlabsVoices.length === 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2" style={{ borderRadius: '2px' }}>
          <strong>ElevenLabs non configuré.</strong> Les dialogues à 3-4 locuteurs nécessitent ElevenLabs — contactez le Pôle PLAI pour activer cette fonctionnalité.
        </div>
      )}

      {/* Tooltip hint — uniquement en mode Gemini */}
      {!useEL && (
        <div className="text-xs text-jfb-gris border border-dashed border-jfb-bordure px-3 py-2" style={{ borderRadius: '2px' }}>
          Survolez les étiquettes <span className="underline decoration-dotted cursor-help">soulignées</span> pour comprendre l&apos;impact réel de chaque champ sur l&apos;audio généré. Les paramètres affinent l&apos;interprétation — ils ne modifient pas le timbre fondamental d&apos;une voix.
        </div>
      )}

      {/* Warning voix même genre */}
      {hasSameGenderPair && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2" style={{ borderRadius: '2px' }}>
          <strong>Deux locuteurs ou plus ont des voix du même genre.</strong>{' '}
          Pour les distinguer à l&apos;écoute, combinez des registres contrastés : <em>Enthousiaste</em> (débit rapide) pour l&apos;un, <em>Hésitant</em> (débit lent) pour l&apos;autre.
        </div>
      )}

      {/* Profils avancés toggle — uniquement en mode Gemini */}
      {!useEL && (
        <button
          onClick={() => setAdvanced(a => !a)}
          className={`w-full text-left px-4 py-3 border-2 transition-colors ${advanced ? 'border-jfb-rose bg-jfb-beige' : 'border-jfb-bordure bg-white hover:border-jfb-rose'}`}
          style={{ borderRadius: '2px' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-jfb-noir">
                {advanced ? '▾ Profils avancés activés' : '▸ Profils avancés'}
              </span>
              <p className="text-xs text-jfb-gris mt-0.5">
                Personnalité, rôle, âge, langue maternelle — la voix s&apos;adapte au personnage dans le script IA
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Speaker profiles */}
      {speakers.map((spk, i) => {
        const profile = profiles.find(p => p.label === spk.label) ?? {
          label: spk.label, voice: femaleVoices[0]?.id ?? 'Aoede',
          name: '', age: '', role: '', nativeLanguage: '', personality: '', style: ''
        }
        return (
          <div key={spk.label} className="border border-jfb-bordure bg-white p-4" style={{ borderRadius: '2px', borderLeft: `3px solid ${SPEAKER_COLORS[i] ?? '#888'}` }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: SPEAKER_COLORS[i] }}>
                {spk.label}
              </span>
              <span className="text-sm font-semibold text-jfb-noir">Locuteur {spk.label}</span>
              {useEL && (
                <span className="ml-auto text-[10px] text-jfb-gris-cl px-1.5 py-0.5 bg-jfb-subtil border border-jfb-bordure" style={{ borderRadius: '2px' }}>ElevenLabs</span>
              )}
            </div>

            <div className={`grid gap-2 mb-2 ${useEL ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div>
                <label
                  className={labelCls}
                  title={useEL
                    ? 'Voix ElevenLabs — 4 féminines et 4 masculines disponibles, choisies pour leur contraste. Pour les dialogues à plusieurs locuteurs du même genre, sélectionnez des voix aux caractères opposés.'
                    : "Paramètre déterminant. 16 voix disponibles : 8 féminines et 8 masculines, choisies pour leur contraste maximal. Pour différencier deux locuteurs, privilégier des voix aux caractères opposés (ex : 'jeune, légère' vs 'mature, posée')."}
                >
                  <span className="underline decoration-dotted cursor-help">Voix</span>
                </label>
                <select
                  value={profile.voice}
                  onChange={e => updateProfile(spk.label, 'voice', e.target.value)}
                  className={inputCls} style={{ borderRadius: '2px' }}
                >
                  {femaleVoices.length > 0 && (
                    <optgroup label="Féminin">
                      {femaleVoices.map(v => (
                        <option key={v.id} value={v.id}>{v.label}{v.character ? ` — ${v.character}` : ''}</option>
                      ))}
                    </optgroup>
                  )}
                  {maleVoices.length > 0 && (
                    <optgroup label="Masculin">
                      {maleVoices.map(v => (
                        <option key={v.id} value={v.id}>{v.label}{v.character ? ` — ${v.character}` : ''}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Registre émotionnel — Gemini uniquement (les tags sont injectés dans le prompt) */}
              {!useEL && (
                <div>
                  <label className={labelCls} title="Levier de différenciation principal après la voix. Agit sur le rythme et l'intonation — pas sur le timbre fondamental. Pour deux locuteurs du même sexe, combiner 'Enthousiaste' (débit rapide) et 'Hésitant' (débit lent) donne le contraste perceptif le plus fort. 'Chaleureux (warm)' a été retiré car il efface les différences entre voix féminines calmes."><span className="underline decoration-dotted cursor-help">Registre émotionnel</span></label>
                  <select
                    value={profile.style === 'warm' ? '' : profile.style}
                    onChange={e => updateProfile(spk.label, 'style', e.target.value)}
                    className={inputCls} style={{ borderRadius: '2px' }}
                  >
                    {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Profils avancés — Gemini uniquement */}
            {!useEL && advanced && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className={labelCls} title="Utilisé par l'IA pour écrire le script (le personnage est nommé dans les répliques) et contextualise la lecture audio. Impact léger mais réel sur le registre."><span className="underline decoration-dotted cursor-help">Prénom du personnage</span></label>
                    <input type="text" value={profile.name} placeholder="Emma, Arnaud..."
                      onChange={e => updateProfile(spk.label, 'name', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                  <div>
                    <label className={labelCls} title="N'a d'effet que sur le script généré par l'IA (Claude adapte les répliques au personnage). Aucun impact sur l'audio — Gemini TTS ne dispose pas de voix spécifiques par tranche d'âge."><span className="underline decoration-dotted cursor-help">Âge</span></label>
                    <input type="text" value={profile.age} placeholder="17 ans, adulte..."
                      onChange={e => updateProfile(spk.label, 'age', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className={labelCls} title="N'a d'effet que sur le script généré par l'IA (Claude écrit des répliques cohérentes avec le rôle). Aucun impact direct sur l'audio."><span className="underline decoration-dotted cursor-help">Rôle / Fonction</span></label>
                    <input type="text" value={profile.role} placeholder="client, hôtelière..."
                      onChange={e => updateProfile(spk.label, 'role', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                  <div>
                    <label className={labelCls} title="Peut légèrement colorer l'accentuation et le débit. Utile pour différencier un locuteur natif d'un apprenant. Impact faible mais cohérent avec les profils réels des élèves."><span className="underline decoration-dotted cursor-help">Langue maternelle</span></label>
                    <input type="text" value={profile.nativeLanguage} placeholder="français belge, néerlandais..."
                      onChange={e => updateProfile(spk.label, 'nativeLanguage', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                </div>

                <div>
                  <label className={labelCls} title="N'a d'effet que sur le script généré par l'IA (Claude adapte le ton et les formulations au caractère du personnage). Aucun impact direct sur l'audio."><span className="underline decoration-dotted cursor-help">Personnalité / Traits</span> <span className="text-jfb-gris-cl">(optionnel)</span></label>
                  <input type="text" value={profile.personality} placeholder="chaleureux, direct, timide..."
                    onChange={e => updateProfile(spk.label, 'personality', e.target.value)}
                    className={inputCls} style={{ borderRadius: '2px' }} />
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* Contexte scénique — Gemini uniquement (EL ne prend pas de prompt système) */}
      {!useEL && (
        <div className="border border-jfb-bordure p-4" style={{ borderRadius: '2px' }}>
          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em]">Contexte scénique</p>
            <span className="text-[10px] text-jfb-gris-cl">(influence le ton des voix, pas le son)</span>
          </div>
          <div className="mb-3">
            <label className={labelCls}>Description de la scène <span className="text-jfb-gris-cl">(optionnel)</span></label>
            <input type="text" value={ambient}
              onChange={e => onAmbientChange(e.target.value)}
              placeholder="hall d'hôtel, musique feutrée · terrasse de café · salle de classe calme..."
              className={inputCls} style={{ borderRadius: '2px' }} />
          </div>
          {ambient && (
            <div>
              <label className={labelCls}>Intensité du contexte : <strong>{ambientIntensity}%</strong></label>
              <input type="range" min={0} max={40} step={5} value={ambientIntensity}
                onChange={e => onAmbientIntensityChange(Number(e.target.value))}
                className="w-full accent-jfb-rose" />
              <div className="flex justify-between text-[10px] text-jfb-gris-cl mt-0.5">
                <span>Neutre</span><span>Subtil</span><span>Marqué</span><span>Fort</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
