'use client'
import { useState } from 'react'

interface Props {
  locale: string
  speakerCount: number
  onGenerated: (script: string) => void
}

const FILIERES = [
  'service en salle', 'cuisine', 'pâtisserie', 'boucherie',
  'coiffure', 'esthétique', 'soins à la personne', 'œnologie',
  'hôtellerie', 'commerce', 'autre',
]

const NIVEAUX = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7']

const LOCALE_NAMES: Record<string, string> = {
  nl_BE: 'Flamand (Belgique)',
  nl_NL: 'Néerlandais (Pays-Bas)',
  fr_FR: 'Français',
  de_DE: 'Allemand',
  en_GB: 'Anglais (UK)',
}

export default function ScriptGenerator({ locale, speakerCount, onGenerated }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [niveau, setNiveau] = useState('S5')
  const [filiere, setFiliere] = useState('service en salle')
  const [sujet, setSujet] = useState('')
  const [nbRepliques, setNbRepliques] = useState(20)
  const [registre, setRegistre] = useState('mixte')
  const [vocabulaire, setVocabulaire] = useState('')
  const [typeDialogue, setTypeDialogue] = useState(speakerCount > 1 ? 'dialogue' : 'monologue')

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
          sujet,
          nb_repliques: nbRepliques,
          registre,
          vocabulaire,
          type_dialogue: typeDialogue,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onGenerated(data.script)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4 border border-purple-200 rounded-xl bg-purple-50">
      <button
        className="w-full flex justify-between items-center px-4 py-3 text-purple-800 font-medium text-sm"
        onClick={() => setOpen(o => !o)}
      >
        <span>✨ Générer le script avec l&apos;IA</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Langue (lecture seule) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Langue cible</label>
            <div className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2">
              {LOCALE_NAMES[locale] ?? locale}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name="type" value="dialogue"
                  checked={typeDialogue === 'dialogue'}
                  onChange={() => setTypeDialogue('dialogue')} />
                Dialogue (A + B)
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name="type" value="monologue"
                  checked={typeDialogue === 'monologue'}
                  onChange={() => setTypeDialogue('monologue')} />
                Monologue (A seul)
              </label>
            </div>
          </div>

          {/* Niveau + Filière */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Niveau</label>
              <select
                value={niveau}
                onChange={e => setNiveau(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5"
              >
                {NIVEAUX.map(n => <option key={n} value={n}>{n} professionnel</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filière</label>
              <select
                value={filiere}
                onChange={e => setFiliere(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5"
              >
                {FILIERES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sujet <span className="text-gray-400">(ex: dressage des tables pour 30 couverts)</span>
            </label>
            <input
              type="text"
              value={sujet}
              onChange={e => setSujet(e.target.value)}
              placeholder="Sujet du dialogue..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5"
            />
          </div>

          {/* Répliques + Registre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Répliques : <strong>{nbRepliques}</strong>
              </label>
              <input
                type="range" min={6} max={60} step={2}
                value={nbRepliques}
                onChange={e => setNbRepliques(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>6</span><span>60</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Registre</label>
              <select
                value={registre}
                onChange={e => setRegistre(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5"
              >
                <option value="formel">Formel</option>
                <option value="informel">Informel</option>
                <option value="mixte">Mixte</option>
              </select>
            </div>
          </div>

          {/* Vocabulaire imposé */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Vocabulaire à inclure <span className="text-gray-400">(optionnel, séparé par des virgules)</span>
            </label>
            <input
              type="text"
              value={vocabulaire}
              onChange={e => setVocabulaire(e.target.value)}
              placeholder="ex: couvert, serviette, mise en place, menu..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          <p className="text-xs text-gray-400">
            Génération via Claude (IA) · Max {/* rate limit */}10 générations/heure · Le script s&apos;insère automatiquement dans l&apos;éditeur.
          </p>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {loading ? 'Génération en cours...' : '✨ Générer le script'}
          </button>
        </div>
      )}
    </div>
  )
}
