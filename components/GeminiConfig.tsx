'use client'
import { useState } from 'react'
import { GeminiVoice, GeminiSpeakerProfile } from '@/types/dialogue'
import { Speaker } from '@/types/dialogue'
import { SPEAKER_COLORS } from '@/lib/voices'

const STYLES = [
  { value: '', label: 'Neutre (par défaut)' },
  { value: 'cheerful', label: 'Joyeux (cheerful)' },
  { value: 'serious', label: 'Sérieux (serious)' },
  { value: 'hesitant', label: 'Hésitant (hesitant)' },
  { value: 'warm', label: 'Chaleureux (warm)' },
  { value: 'excited', label: 'Enthousiaste (excited)' },
  { value: 'thoughtful', label: 'Réfléchi (thoughtful)' },
  { value: 'professional', label: 'Professionnel' },
]

interface Props {
  speakers: Speaker[]
  geminiVoices: GeminiVoice[]
  profiles: GeminiSpeakerProfile[]
  ambient: string
  ambientIntensity: number
  onProfilesChange: (profiles: GeminiSpeakerProfile[]) => void
  onAmbientChange: (ambient: string) => void
  onAmbientIntensityChange: (intensity: number) => void
}

export default function GeminiConfig({
  speakers, geminiVoices, profiles, ambient, ambientIntensity,
  onProfilesChange, onAmbientChange, onAmbientIntensityChange
}: Props) {
  const [advanced, setAdvanced] = useState(false)

  const updateProfile = (label: string, field: keyof GeminiSpeakerProfile, value: string) => {
    onProfilesChange(profiles.map(p => p.label === label ? { ...p, [field]: value } : p))
  }

  const femaleVoices = geminiVoices.filter(v => v.gender === 'féminin')
  const maleVoices = geminiVoices.filter(v => v.gender === 'masculin')

  const inputCls = "w-full text-sm border border-jfb-bordure px-2 py-1.5 bg-white"
  const labelCls = "block text-[11px] font-medium text-jfb-gris mb-1"

  return (
    <div className="space-y-4">

      {/* Usage info */}
      <div className="text-xs text-jfb-gris bg-jfb-subtil border border-jfb-bordure px-3 py-2" style={{ borderRadius: '2px' }}>
        <span><span className="font-semibold text-jfb-rose">Voix génératives IA</span> · 500 générations/jour · Pas d'inscription requise</span>
      </div>

      {/* Tooltip hint */}
      <div className="text-xs text-jfb-gris border border-dashed border-jfb-bordure px-3 py-2" style={{ borderRadius: '2px' }}>
        Survolez les étiquettes <span className="underline decoration-dotted cursor-help">soulignées</span> pour comprendre l'impact réel de chaque champ sur l'audio généré. Les paramètres affinent l'interprétation — ils ne modifient pas le timbre fondamental d'une voix.
      </div>

      {/* Profils avancés toggle */}
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
              Personnalité, rôle, âge, langue maternelle — la voix s'adapte au personnage dans le script IA
            </p>
          </div>
        </div>
      </button>

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
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className={labelCls} title="Paramètre déterminant. Chaque voix a un timbre fondamental que les autres paramètres ne peuvent pas modifier — deux locuteurs avec la même voix resteront perceptivement proches, quelle que soit la configuration. Pour une distinction claire à l'oreille, choisir deux voix contrastées est indispensable."><span className="underline decoration-dotted cursor-help">Voix</span></label>
                <select
                  value={profile.voice}
                  onChange={e => updateProfile(spk.label, 'voice', e.target.value)}
                  className={inputCls} style={{ borderRadius: '2px' }}
                >
                  <optgroup label="Féminin">
                    {femaleVoices.map(v => (
                      <option key={v.id} value={v.id}>{v.label} — {v.character}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Masculin">
                    {maleVoices.map(v => (
                      <option key={v.id} value={v.id}>{v.label} — {v.character}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className={labelCls} title="Impact réel sur la prosodie depuis la dernière mise à jour. Influe sur le rythme, l'intonation et l'intensité de chaque réplique. Combiné à la voix, c'est le levier le plus efficace."><span className="underline decoration-dotted cursor-help">Registre émotionnel</span></label>
                <select
                  value={profile.style}
                  onChange={e => updateProfile(spk.label, 'style', e.target.value)}
                  className={inputCls} style={{ borderRadius: '2px' }}
                >
                  {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {advanced && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className={labelCls} title="Utilisé par l'IA pour écrire le script (le personnage est nommé dans les répliques) et contextualise la lecture audio. Impact léger mais réel sur le registre."><span className="underline decoration-dotted cursor-help">Prénom du personnage</span></label>
                    <input type="text" value={profile.name} placeholder="Emma, Arnaud..."
                      onChange={e => updateProfile(spk.label, 'name', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                  <div>
                    <label className={labelCls} title="Indicatif. Influence légèrement le rythme et le registre de lecture. Gemini n'a pas de voix spécifiques par tranche d'âge — deux voix masculines resteront distinctes quelle que soit l'âge renseigné."><span className="underline decoration-dotted cursor-help">Âge</span></label>
                    <input type="text" value={profile.age} placeholder="17 ans, adulte..."
                      onChange={e => updateProfile(spk.label, 'age', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className={labelCls} title="Impact modéré sur le ton de lecture. Un 'client impatient' ne sonnera pas pareil qu'une 'hôtelière professionnelle'. Influence aussi la qualité du script généré par l'IA."><span className="underline decoration-dotted cursor-help">Rôle / Fonction</span></label>
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
                  <label className={labelCls} title="Impact modéré sur le registre de lecture. Combiné au registre émotionnel, renforce la cohérence du personnage sur toute la durée du dialogue. Exemples efficaces : 'chaleureux et direct', 'nerveux, parle vite'."><span className="underline decoration-dotted cursor-help">Personnalité / Traits</span> <span className="text-jfb-gris-cl">(optionnel)</span></label>
                  <input type="text" value={profile.personality} placeholder="chaleureux, direct, timide..."
                    onChange={e => updateProfile(spk.label, 'personality', e.target.value)}
                    className={inputCls} style={{ borderRadius: '2px' }} />
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* Ambient sound */}
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
    </div>
  )
}
