'use client'
import { useState } from 'react'
import { GeminiVoice, GeminiSpeakerProfile } from '@/types/dialogue'
import { Speaker } from '@/types/dialogue'

const SPEAKER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']

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

      {/* Usage info + mode toggle */}
      <div className="flex items-center justify-between text-xs text-jfb-gris bg-jfb-subtil border border-jfb-bordure px-3 py-2" style={{ borderRadius: '2px' }}>
        <span><span className="font-semibold text-jfb-rose">Gemini TTS</span> · 1 500/jour · 15/min · Clé PLAI · Pas d'inscription requise</span>
        <button
          onClick={() => setAdvanced(a => !a)}
          className="ml-3 flex-shrink-0 text-[10px] px-2 py-0.5 border border-jfb-bordure text-jfb-gris hover:border-jfb-rose hover:text-jfb-rose"
          style={{ borderRadius: '2px' }}
        >
          {advanced ? 'Mode simple' : 'Profils avancés'}
        </button>
      </div>

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
                <label className={labelCls}>Voix Gemini</label>
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
                <label className={labelCls}>Registre émotionnel</label>
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
                    <label className={labelCls}>Prénom du personnage</label>
                    <input type="text" value={profile.name} placeholder="Emma, Arnaud..."
                      onChange={e => updateProfile(spk.label, 'name', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                  <div>
                    <label className={labelCls}>Âge</label>
                    <input type="text" value={profile.age} placeholder="17 ans, adulte..."
                      onChange={e => updateProfile(spk.label, 'age', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className={labelCls}>Rôle / Fonction</label>
                    <input type="text" value={profile.role} placeholder="client, hôtelière..."
                      onChange={e => updateProfile(spk.label, 'role', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                  <div>
                    <label className={labelCls}>Langue maternelle</label>
                    <input type="text" value={profile.nativeLanguage} placeholder="français belge, néerlandais..."
                      onChange={e => updateProfile(spk.label, 'nativeLanguage', e.target.value)}
                      className={inputCls} style={{ borderRadius: '2px' }} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Personnalité / Traits <span className="text-jfb-gris-cl">(optionnel)</span></label>
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
        <p className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-3">Ambiance sonore</p>
        <div className="mb-3">
          <label className={labelCls}>Description de la scène <span className="text-jfb-gris-cl">(optionnel)</span></label>
          <input type="text" value={ambient}
            onChange={e => onAmbientChange(e.target.value)}
            placeholder="hall d'hôtel, musique feutrée · terrasse de café · salle de classe calme..."
            className={inputCls} style={{ borderRadius: '2px' }} />
        </div>
        {ambient && (
          <div>
            <label className={labelCls}>Intensité de l'ambiance : <strong>{ambientIntensity}%</strong></label>
            <input type="range" min={0} max={40} step={5} value={ambientIntensity}
              onChange={e => onAmbientIntensityChange(Number(e.target.value))}
              className="w-full accent-jfb-rose" />
            <div className="flex justify-between text-[10px] text-jfb-gris-cl mt-0.5">
              <span>Silence</span><span>Très discrète</span><span>Modérée</span><span>Présente</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
