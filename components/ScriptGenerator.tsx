'use client'
import { useRef, useState } from 'react'

interface Props {
  locale: string
  speakerCount: number
  onGenerated: (script: string) => void
  mode: 'dialogue' | 'podcast'
}

const LOCALE_NAMES: Record<string, string> = {
  nl_BE: 'Flamand (Belgique)',
  nl_NL: 'Néerlandais (Pays-Bas)',
  fr_FR: 'Français',
  fr_BE: 'Français (Belgique)',
  de_DE: 'Allemand',
  en_GB: 'Anglais (UK)',
  es_ES: 'Espagnol',
}

// ── Dialogue generator ────────────────────────────────────────────────────────

function DialogueGenerator({ locale, speakerCount, onGenerated }: Omit<Props, 'mode'>) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [niveau, setNiveau] = useState('')
  const [filiere, setFiliere] = useState('')
  const [contexte, setContexte] = useState('')
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
        body: JSON.stringify({ locale, niveau, filiere, contexte, sujet, nb_repliques: nbRepliques, registre, vocabulaire, type_dialogue: typeDialogue }),
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
      <button className="w-full flex justify-between items-center px-4 py-3 text-purple-800 font-medium text-sm" onClick={() => setOpen(o => !o)}>
        <span>✨ Générer le script avec l&apos;IA</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Langue cible</label>
            <div className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2">{LOCALE_NAMES[locale] ?? locale}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <div className="flex gap-3 text-sm">
              {['dialogue', 'monologue'].map(t => (
                <label key={t} className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="type" value={t} checked={typeDialogue === t} onChange={() => setTypeDialogue(t)} />
                  {t === 'dialogue' ? 'Dialogue (A + B)' : 'Monologue (A seul)'}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Niveau <span className="text-gray-400">(optionnel)</span></label>
              <input type="text" value={niveau} onChange={e => setNiveau(e.target.value)} placeholder="S5 pro, débutant, adulte..." className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filière / Domaine <span className="text-gray-400">(optionnel)</span></label>
              <input type="text" value={filiere} onChange={e => setFiliere(e.target.value)} placeholder="cuisine, tourisme, santé..." className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contexte situationnel <span className="text-gray-400">(optionnel)</span></label>
            <input type="text" value={contexte} onChange={e => setContexte(e.target.value)} placeholder="au restaurant, chez le médecin, en classe..." className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sujet</label>
            <input type="text" value={sujet} onChange={e => setSujet(e.target.value)} placeholder="Sujet du dialogue..." className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Répliques : <strong>{nbRepliques}</strong></label>
              <input type="range" min={6} max={60} step={2} value={nbRepliques} onChange={e => setNbRepliques(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-xs text-gray-400"><span>6</span><span>60</span></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Registre</label>
              <select value={registre} onChange={e => setRegistre(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5">
                <option value="formel">Formel</option>
                <option value="informel">Informel</option>
                <option value="mixte">Mixte</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vocabulaire à inclure <span className="text-gray-400">(optionnel, séparé par des virgules)</span></label>
            <input type="text" value={vocabulaire} onChange={e => setVocabulaire(e.target.value)} placeholder="ex: couvert, serviette, mise en place..." className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <p className="text-xs text-gray-400">Génération via Claude (IA) · Max 10 générations/heure · Le script s&apos;insère automatiquement dans l&apos;éditeur.</p>
          <button onClick={handleGenerate} disabled={loading} className="w-full py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition">
            {loading ? 'Génération en cours...' : '✨ Générer le script'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Podcast generator ─────────────────────────────────────────────────────────

function PodcastGenerator({ locale, onGenerated }: Omit<Props, 'mode' | 'speakerCount'>) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sujet, setSujet] = useState('')
  const [roleA, setRoleA] = useState('Animatrice')
  const [roleB, setRoleB] = useState('Expert(e)')
  const [nbRepliques, setNbRepliques] = useState(40)
  const [sourceText, setSourceText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    if (file.name.endsWith('.txt')) {
      setSourceText(await file.text())
    } else if (file.name.endsWith('.docx')) {
      const mammoth = (await import('mammoth')).default
      const buf = await file.arrayBuffer()
      const { value } = await mammoth.extractRawText({ arrayBuffer: buf })
      setSourceText(value)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          type_dialogue: 'podcast',
          sujet,
          role_a: roleA,
          role_b: roleB,
          nb_repliques: nbRepliques,
          source_text: sourceText,
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
    <div className="mb-4 border border-orange-200 rounded-xl bg-orange-50">
      <button className="w-full flex justify-between items-center px-4 py-3 text-orange-800 font-medium text-sm" onClick={() => setOpen(o => !o)}>
        <span>🎙️ Générer un podcast avec l&apos;IA</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Langue cible</label>
            <div className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2">{LOCALE_NAMES[locale] ?? locale}</div>
          </div>

          {/* Rôles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-500 text-white text-center text-xs leading-5 mr-1">A</span>
                Rôle animateur/animatrice
              </label>
              <input type="text" value={roleA} onChange={e => setRoleA(e.target.value)} placeholder="Animatrice, Journaliste..." className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <span className="inline-block w-5 h-5 rounded-full bg-red-500 text-white text-center text-xs leading-5 mr-1">B</span>
                Rôle expert(e)
              </label>
              <input type="text" value={roleB} onChange={e => setRoleB(e.target.value)} placeholder="Expert(e), Chercheur(e)..." className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5" />
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sujet du podcast</label>
            <input type="text" value={sujet} onChange={e => setSujet(e.target.value)} placeholder="ex: l'impact du numérique sur l'éducation..." className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
          </div>

          {/* Nombre de répliques */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Répliques : <strong>{nbRepliques}</strong>
              <span className="text-gray-400 ml-2 font-normal">(~{Math.round(nbRepliques * 7 / 60)} min audio estimées)</span>
            </label>
            <input type="range" min={20} max={80} step={4} value={nbRepliques} onChange={e => setNbRepliques(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400"><span>20 (~2 min)</span><span>80 (~9 min)</span></div>
          </div>

          {/* Source optionnelle */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Source <span className="text-gray-400">(optionnel — article, texte de référence)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
              >
                📄 Importer .txt / .docx
              </button>
              {fileName && <span className="text-xs text-gray-500 self-center">{fileName}</span>}
              {sourceText && <button type="button" onClick={() => { setSourceText(''); setFileName(null) }} className="text-xs text-red-400 hover:text-red-600">✕ Effacer</button>}
            </div>
            <input ref={fileRef} type="file" accept=".txt,.docx" className="hidden" onChange={handleFile} />
            <textarea
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              placeholder="Ou collez directement un texte source ici..."
              rows={4}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <p className="text-xs text-gray-400">
            🎙️ Mode Podcast · A = {roleA || 'Animateur/trice'} · B = {roleB || 'Expert(e)'} · Génération directe en {LOCALE_NAMES[locale] ?? locale} · Max 10/heure
          </p>
          <p className="text-xs text-orange-700 bg-orange-100 rounded px-3 py-2">
            ⏱ La génération audio d&apos;un podcast peut prendre <strong>1 à 3 minutes</strong>. Le script reste éditable avant de lancer l&apos;audio.
          </p>

          <button onClick={handleGenerate} disabled={loading || !sujet.trim()} className="w-full py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition">
            {loading ? 'Génération en cours...' : '🎙️ Générer le script podcast'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function ScriptGenerator({ locale, speakerCount, onGenerated, mode }: Props) {
  if (mode === 'podcast') {
    return <PodcastGenerator locale={locale} onGenerated={onGenerated} />
  }
  return <DialogueGenerator locale={locale} speakerCount={speakerCount} onGenerated={onGenerated} />
}
