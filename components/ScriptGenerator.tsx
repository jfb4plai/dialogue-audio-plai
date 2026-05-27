'use client'
import { useState } from 'react'
import { GeminiSpeakerProfile } from '@/types/dialogue'
import { useWizard } from '@/lib/wizard-context'

interface Props {
  locale: string
  speakerCount: number
  onGenerated: (script: string) => void
  engine?: string
  geminiProfiles?: GeminiSpeakerProfile[]
}

const LOCALE_NAMES: Record<string, string> = {
  nl_BE: 'Flamand (Belgique)',
  nl_NL: 'Néerlandais (Pays-Bas)',
  fr_FR: 'Français',
  fr_BE: 'Français (Belgique)',
  de_DE: 'Allemand',
  en_GB: 'Anglais (UK)',
  es_ES: 'Espagnol',
  it_IT: 'Italien',
}

export default function ScriptGenerator({ locale, speakerCount, onGenerated, engine, geminiProfiles }: Props) {
  const { dispatch } = useWizard()
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [niveau, setNiveau] = useState('')
  const [filiere, setFiliere] = useState('')
  const [contexte, setContexte] = useState('')
  const [sujet, setSujet] = useState('')
  const [nbRepliques, setNbRepliques] = useState(20)
  const [registre, setRegistre] = useState('mixte')
  const [vocabulaire, setVocabulaire] = useState('')
  const typeDialogue = speakerCount === 1 ? 'monologue' : 'dialogue'

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, niveau, filiere, contexte, sujet, nb_repliques: nbRepliques, registre, vocabulaire, type_dialogue: typeDialogue, nb_locuteurs: speakerCount, gemini_profiles: engine === 'gemini' ? geminiProfiles : undefined }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      dispatch({ type: 'SET_NIVEAU', payload: niveau })
      dispatch({ type: 'SET_VOCABULAIRE', payload: vocabulaire })
      onGenerated(data.script)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4 border border-jfb-bordure bg-jfb-beige" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
      <button className="w-full flex justify-between items-center px-4 py-3 text-jfb-noir font-medium text-sm" onClick={() => setOpen(o => !o)}>
        <span>✨ Générer le script avec l&apos;IA</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Langue cible</label>
            <div className="text-sm text-jfb-noir bg-white border border-jfb-bordure px-3 py-2" style={{ borderRadius: '2px' }}>{LOCALE_NAMES[locale] ?? locale}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <div className="text-sm text-jfb-noir bg-white border border-jfb-bordure px-3 py-2" style={{ borderRadius: '2px' }}>
              {speakerCount === 1
                ? 'Monologue (A seul)'
                : `Dialogue — ${speakerCount} locuteurs (${['A','B','C','D'].slice(0, speakerCount).join(', ')})`}
            </div>
          </div>
          {engine === 'gemini' && geminiProfiles && geminiProfiles.some(p => p.name || p.role || p.age) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Personnages Gemini <span className="text-jfb-rose">(utilisés pour la génération)</span></label>
              <div className="space-y-1">
                {geminiProfiles.map(p => {
                  const desc = [p.name, p.age, p.role, p.nativeLanguage, p.personality].filter(Boolean).join(' · ')
                  return desc ? (
                    <div key={p.label} className="text-xs bg-white border border-jfb-bordure px-3 py-1.5" style={{ borderRadius: '2px' }}>
                      <span className="font-semibold text-jfb-rose mr-2">{p.label}</span>{desc}
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Niveau CECRL</label>
              <select value={niveau} onChange={e => setNiveau(e.target.value)} className="w-full text-sm border border-jfb-bordure px-2 py-1.5 bg-white" style={{ borderRadius: '2px' }}>
                <option value="">— non précisé —</option>
                <option value="A1">A1 — Débutant</option>
                <option value="A2">A2 — Élémentaire</option>
                <option value="B1">B1 — Intermédiaire</option>
                <option value="B2">B2 — Avancé</option>
                <option value="C1">C1 — Autonome</option>
                <option value="C2">C2 — Maîtrise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filière / Domaine <span className="text-gray-400">(optionnel)</span></label>
              <input type="text" value={filiere} onChange={e => setFiliere(e.target.value)} placeholder="cuisine, tourisme, santé..." className="w-full text-sm border border-jfb-bordure px-2 py-1.5 bg-white" style={{ borderRadius: '2px' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contexte situationnel <span className="text-gray-400">(optionnel)</span></label>
            <input type="text" value={contexte} onChange={e => setContexte(e.target.value)} placeholder="au restaurant, chez le médecin, en classe..." className="w-full text-sm border border-jfb-bordure px-3 py-1.5 bg-white" style={{ borderRadius: '2px' }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sujet</label>
            <input type="text" value={sujet} onChange={e => setSujet(e.target.value)} placeholder="Sujet du dialogue..." className="w-full text-sm border border-jfb-bordure px-3 py-1.5 bg-white" style={{ borderRadius: '2px' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Répliques : <strong>{nbRepliques}</strong></label>
              <input type="range" min={6} max={60} step={2} value={nbRepliques} onChange={e => setNbRepliques(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-xs text-gray-400"><span>6</span><span>60</span></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Registre</label>
              <select value={registre} onChange={e => setRegistre(e.target.value)} className="w-full text-sm border border-jfb-bordure px-2 py-1.5 bg-white" style={{ borderRadius: '2px' }}>
                <option value="formel">Formel</option>
                <option value="informel">Informel</option>
                <option value="mixte">Mixte</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vocabulaire à inclure <span className="text-gray-400">(optionnel, séparé par des virgules)</span></label>
            <input type="text" value={vocabulaire} onChange={e => setVocabulaire(e.target.value)} placeholder="ex: couvert, serviette, mise en place..." className="w-full text-sm border border-jfb-bordure px-3 py-1.5 bg-white" style={{ borderRadius: '2px' }} />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <p className="text-xs text-gray-400">Génération via Claude (IA) · Max 10 générations/heure · Le script s&apos;insère automatiquement dans l&apos;éditeur.</p>
          <button onClick={handleGenerate} disabled={loading} className="w-full py-2 text-sm font-semibold bg-jfb-noir text-white hover:bg-jfb-noir-doux disabled:opacity-50 transition" style={{ borderRadius: '2px' }}>
            {loading ? 'Génération en cours...' : '✨ Générer le script'}
          </button>
        </div>
      )}
    </div>
  )
}
