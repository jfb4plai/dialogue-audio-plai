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

const ROLE_PLACEHOLDERS: Record<number, string[]> = {
  0: ['ex : client, patient, élève, touriste…'],
  1: ['ex : vendeur, médecin, professeur, guide…'],
  2: ['ex : collègue, ami, responsable…'],
  3: ['ex : témoin, interprète, tiers…'],
}

export default function ScriptGenerator({ locale, speakerCount, onGenerated, engine, geminiProfiles }: Props) {
  const { state, dispatch } = useWizard()
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [niveau, setNiveau] = useState(state.niveau ?? '')
  const [classe, setClasse] = useState('')
  const [filiere, setFiliere] = useState('')
  const [contexte, setContexte] = useState('')
  const [sujet, setSujet] = useState('')
  const [nbRepliques, setNbRepliques] = useState(20)
  const [registre, setRegistre] = useState('mixte')
  const [vocabulaire, setVocabulaire] = useState('')
  // Rôle de chaque locuteur — pré-rempli depuis geminiProfiles si disponibles
  const initRoles = () => {
    const r: Record<string, string> = {}
    const labels = ['A', 'B', 'C', 'D'].slice(0, speakerCount)
    labels.forEach(l => {
      const p = geminiProfiles?.find(p => p.label === l)
      r[l] = p?.role ?? ''
    })
    return r
  }
  const [roles, setRoles] = useState<Record<string, string>>(initRoles)

  const typeDialogue = speakerCount === 1 ? 'monologue' : 'dialogue'
  const letters = ['A', 'B', 'C', 'D'].slice(0, speakerCount)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          niveau,
          filiere,
          contexte,
          sujet,
          nb_repliques: nbRepliques,
          registre,
          vocabulaire,
          type_dialogue: typeDialogue,
          nb_locuteurs: speakerCount,
          roles: letters.map(l => ({ label: l, role: roles[l] ?? '' })),
          gemini_profiles: engine === 'gemini' ? geminiProfiles : undefined,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      dispatch({ type: 'SET_NIVEAU', payload: niveau })
      dispatch({ type: 'SET_VOCABULAIRE', payload: vocabulaire })
      dispatch({ type: 'SET_CLASSE', payload: classe })
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

          {/* Langue + Type — info uniquement */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Langue cible</label>
              <div className="text-sm text-jfb-noir bg-white border border-jfb-bordure px-3 py-2" style={{ borderRadius: '2px' }}>
                {LOCALE_NAMES[locale] ?? locale}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <div className="text-sm text-jfb-noir bg-white border border-jfb-bordure px-3 py-2" style={{ borderRadius: '2px' }}>
                {speakerCount === 1
                  ? 'Monologue (A seul)'
                  : `Dialogue — ${speakerCount} locuteurs (${letters.join(', ')})`}
              </div>
            </div>
          </div>

          {/* Rôles des locuteurs — section principale */}
          <div className="bg-white border border-jfb-bordure p-3" style={{ borderRadius: '2px', borderLeft: '2px solid #FF3399' }}>
            <label className="block text-xs font-semibold text-jfb-rose mb-1">
              Rôles des locuteurs
            </label>
            <p className="text-xs text-gray-500 mb-2.5 leading-snug">
              Définir le rôle de chaque personnage rend les répliques cohérentes et distinctes — le médecin et le patient ne s&apos;expriment pas de la même façon.
            </p>
            <div className="space-y-2">
              {letters.map((letter, i) => (
                <div key={letter} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-jfb-rose text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {letter}
                  </span>
                  <input
                    type="text"
                    value={roles[letter] ?? ''}
                    onChange={e => setRoles(r => ({ ...r, [letter]: e.target.value }))}
                    placeholder={ROLE_PLACEHOLDERS[i]?.[0] ?? 'rôle du personnage…'}
                    className="flex-1 text-sm border border-jfb-bordure px-2 py-1.5 bg-white"
                    style={{ borderRadius: '2px' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Niveau + Filière */}
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
              <p className="text-xs text-gray-400 mt-1 leading-snug">Calibre la complexité du vocabulaire, des structures et la longueur des répliques.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filière / Domaine <span className="text-gray-400">(optionnel)</span></label>
              <input type="text" value={filiere} onChange={e => setFiliere(e.target.value)} placeholder="cuisine, tourisme, santé…" className="w-full text-sm border border-jfb-bordure px-2 py-1.5 bg-white" style={{ borderRadius: '2px' }} />
            </div>
          </div>

          {/* Contexte + Sujet */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contexte situationnel <span className="text-gray-400">(optionnel)</span></label>
            <input type="text" value={contexte} onChange={e => setContexte(e.target.value)} placeholder="au restaurant, chez le médecin, en classe, à l'accueil…" className="w-full text-sm border border-jfb-bordure px-3 py-1.5 bg-white" style={{ borderRadius: '2px' }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sujet</label>
            <input type="text" value={sujet} onChange={e => setSujet(e.target.value)} placeholder="Sujet du dialogue…" className="w-full text-sm border border-jfb-bordure px-3 py-1.5 bg-white" style={{ borderRadius: '2px' }} />
          </div>

          {/* Mots cibles — section mise en évidence */}
          <div className="border border-jfb-rose bg-white p-3" style={{ borderRadius: '2px' }}>
            <label className="block text-xs font-semibold text-jfb-rose mb-1">
              Mots cibles à travailler{' '}
              <span className="font-normal text-gray-400">(séparés par des virgules)</span>
            </label>
            <input
              type="text"
              value={vocabulaire}
              onChange={e => setVocabulaire(e.target.value)}
              placeholder="ex : couvert, serviette, mise en place, réservation…"
              className="w-full text-sm border border-jfb-bordure px-3 py-1.5 bg-white mb-1.5"
              style={{ borderRadius: '2px' }}
            />
            <p className="text-xs text-gray-500 leading-snug">
              Ces mots seront intégrés dans le dialogue <strong>et figureront toujours dans le lexique généré</strong> — ils constituent les cibles lexicales de l&apos;activité.
            </p>
          </div>

          {/* Répliques + Registre */}
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

          {/* Classe — info uniquement, non envoyée à l'IA */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Classe <span className="text-gray-400">(optionnel — non envoyé à l&apos;IA)</span></label>
            <input type="text" value={classe} onChange={e => setClasse(e.target.value)} placeholder="ex : 3e secondaire, 4TEC, CP…" className="w-full text-sm border border-jfb-bordure px-2 py-1.5 bg-white" style={{ borderRadius: '2px' }} />
          </div>

          {/* Personnages Gemini — info complémentaire si remplis */}
          {engine === 'gemini' && geminiProfiles && geminiProfiles.some(p => p.name || p.age || p.personality) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Détails personnages <span className="text-jfb-rose">(depuis la config audio)</span></label>
              <div className="space-y-1">
                {geminiProfiles.map(p => {
                  const desc = [p.name, p.age, p.nativeLanguage, p.personality].filter(Boolean).join(' · ')
                  return desc ? (
                    <div key={p.label} className="text-xs bg-white border border-jfb-bordure px-3 py-1.5" style={{ borderRadius: '2px' }}>
                      <span className="font-semibold text-jfb-rose mr-2">{p.label}</span>{desc}
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <p className="text-xs text-gray-400">Génération via Claude (IA) · Max 10 générations/heure · Le script s&apos;insère automatiquement dans l&apos;éditeur.</p>
          <button onClick={handleGenerate} disabled={loading} className="w-full py-2 text-sm font-semibold bg-jfb-noir text-white hover:bg-jfb-noir-doux disabled:opacity-50 transition" style={{ borderRadius: '2px' }}>
            {loading ? 'Génération en cours…' : '✨ Générer le script'}
          </button>
        </div>
      )}
    </div>
  )
}
