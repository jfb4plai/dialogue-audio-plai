'use client'
import { useState } from 'react'
import { Speaker } from '@/types/dialogue'

interface QuizQuestion {
  question: string
  answer: string
  justification: string
}

interface Props {
  script: string
  locale: string
  speakers: Speaker[]
}

// Stopwords FR / NL / DE / EN / ES / IT (minimal)
const STOPWORDS = new Set([
  // FR
  'le','la','les','de','du','des','un','une','et','en','à','au','aux','je','tu','il','elle','nous','vous','ils','elles',
  'me','te','se','lui','leur','y','on','ce','que','qui','quoi','dont','où','ne','pas','plus','très','bien','tout','tous',
  'mon','ton','son','ma','ta','sa','mes','tes','ses','notre','votre','avec','dans','sur','par','pour','mais','ou','si',
  'car','est','sont','être','avoir','fait','aussi','comme','cette','cet','ces','ça','c','l','m','d','j','n','qu',
  // NL
  'de','het','een','van','in','op','aan','met','voor','is','zijn','ik','jij','hij','zij','wij','jullie','ze','dat','die',
  'dit','er','en','maar','of','als','niet','ook','wel','heel','al','nog','dan','om','te','bij','mijn','jouw','haar',
  'ons','uw','hun','kan','mag','moet','wil','zou','zal','naar','uit','over','door','wordt','heeft','hebben',
  // DE
  'der','die','das','ein','eine','und','zu','von','mit','auf','ist','sind','ich','du','er','sie','wir','ihr','es',
  'dass','für','an','auch','nicht','aber','oder','wenn','als','um','bei','so','noch','aus','hat','haben','sein','nach',
  'über','wird','dem','den','des','mich','dich','sich','uns','euch','ihm','ihnen',
  // EN
  'the','a','an','and','in','on','at','to','of','for','is','are','i','you','he','she','we','they','it','this','that',
  'be','have','do','not','with','but','or','if','as','by','from','was','were','had','has','can','will','would','could',
  // ES
  'el','la','los','las','un','una','de','en','con','por','para','es','son','yo','él','ella','nosotros','ellos',
  // IT
  'il','i','le','di','in','con','per','sono','ho','che','mi','ti','si','ci','vi','lo','li',
])

function parseLines(script: string): { label: string; content: string }[] {
  return script.split('\n')
    .map(l => l.trim())
    .filter(l => /^[A-D]:\s/.test(l))
    .map(l => ({ label: l[0], content: l.slice(3).trim() }))
}

function extractLexique(lines: { label: string; content: string }[]): { word: string; example: string }[] {
  const seen = new Map<string, string>()
  for (const { content } of lines) {
    const tokens = content.split(/[\s,;:.!?'"«»()\[\]—–]+/).filter(Boolean)
    for (const raw of tokens) {
      const word = raw.toLowerCase().replace(/[^a-zàáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿœ]/gi, '')
      if (word.length < 3) continue
      if (STOPWORDS.has(word)) continue
      if (!seen.has(word)) seen.set(word, content)
    }
  }
  return Array.from(seen.entries())
    .map(([word, example]) => ({ word, example }))
    .sort((a, b) => a.word.localeCompare(b.word))
}

function makeTrous(lines: { label: string; content: string }[], every: number): { label: string; content: string; masked: string }[] {
  return lines.map(({ label, content }) => {
    const tokens = content.split(' ')
    let count = 0
    const masked: string[] = []
    for (const token of tokens) {
      const clean = token.replace(/[^a-zA-ZàáâãäåæçèéêëìíîïðñòóôõöùúûüýÿœÀ-Ö]/g, '')
      if (clean.length >= 3 && !STOPWORDS.has(clean.toLowerCase())) {
        count++
        if (count % every === 0) {
          masked.push('_'.repeat(Math.max(6, clean.length)))
          continue
        }
      }
      masked.push(token)
    }
    return { label, content, masked: masked.join(' ') }
  })
}

export default function ActivitesDeriveesPanel({ script, locale, speakers }: Props) {
  const [activeTab, setActiveTab] = useState<'lexique' | 'trous' | 'quiz' | null>(null)
  const [every, setEvery] = useState(5)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)

  const lines = parseLines(script)
  const lexique = extractLexique(lines)
  const trousLines = makeTrous(lines, every)

  const loadQuiz = async () => {
    if (quizLoading) return
    setQuizLoading(true)
    setQuizError(null)
    setQuizQuestions(null)
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, locale }),
      })
      const data = await res.json()
      if (data.error) { setQuizError(data.error); return }
      setQuizQuestions(data.questions)
    } catch {
      setQuizError('Erreur réseau.')
    } finally {
      setQuizLoading(false)
    }
  }

  const exportDocx = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')

    const children = [
      new Paragraph({ text: 'Texte à trous — élève', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: '' }),
    ]
    for (const { label, masked } of trousLines) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true }),
          new TextRun({ text: masked }),
        ],
      }))
    }
    children.push(new Paragraph({ children: [new TextRun({ text: '', break: 1 })], pageBreakBefore: true }))
    children.push(new Paragraph({ text: 'Corrigé — enseignant', heading: HeadingLevel.HEADING_1 }))
    children.push(new Paragraph({ text: '' }))
    for (const { label, content } of trousLines) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true }),
          new TextRun({ text: content }),
        ],
      }))
    }

    const doc = new Document({ sections: [{ children }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'texte-a-trous.docx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabBtn = (tab: typeof activeTab, label: string, onClick?: () => void) => (
    <button
      key={tab}
      onClick={() => { setActiveTab(tab); onClick?.() }}
      className={`px-4 py-2 text-sm font-medium border transition-colors ${
        activeTab === tab
          ? 'bg-jfb-noir text-white border-jfb-noir'
          : 'bg-white text-jfb-noir border-jfb-bordure hover:bg-jfb-beige'
      }`}
      style={{ borderRadius: '2px' }}
    >
      {label}
    </button>
  )

  return (
    <div className="mt-6 border border-jfb-bordure" style={{ borderRadius: '2px' }}>
      <div className="px-5 py-4 border-b border-jfb-bordure bg-jfb-subtil">
        <h2 className="text-sm font-bold text-jfb-noir mb-3">Activités dérivées</h2>
        <div className="flex gap-2 flex-wrap">
          {tabBtn('lexique', 'Lexique')}
          {tabBtn('trous', 'Texte à trous')}
          {tabBtn('quiz', 'Vrai / Faux', loadQuiz)}
        </div>
      </div>

      {/* LEXIQUE */}
      {activeTab === 'lexique' && (
        <div className="p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-jfb-gris">{lexique.length} mots clés extraits</p>
            <button
              onClick={() => window.print()}
              className="text-xs border border-jfb-bordure px-3 py-1 hover:bg-jfb-beige"
              style={{ borderRadius: '2px' }}
            >
              Imprimer
            </button>
          </div>
          {lexique.length === 0 ? (
            <p className="text-sm text-jfb-gris">Aucun mot clé détecté dans ce script.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-jfb-beige">
                  <th className="text-left px-3 py-2 border border-jfb-bordure font-medium text-jfb-noir w-1/3">Mot</th>
                  <th className="text-left px-3 py-2 border border-jfb-bordure font-medium text-jfb-noir">Exemple dans le dialogue</th>
                </tr>
              </thead>
              <tbody>
                {lexique.map(({ word, example }) => (
                  <tr key={word}>
                    <td className="px-3 py-2 border border-jfb-bordure font-medium text-jfb-noir">{word}</td>
                    <td className="px-3 py-2 border border-jfb-bordure text-jfb-gris text-xs italic">«&#8201;{example}&#8201;»</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TEXTE À TROUS */}
      {activeTab === 'trous' && (
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-jfb-gris">Difficulté :</label>
              <select
                value={every}
                onChange={e => setEvery(Number(e.target.value))}
                className="text-sm border border-jfb-bordure px-2 py-1 bg-white"
                style={{ borderRadius: '2px' }}
              >
                <option value={3}>1 mot sur 3 (difficile)</option>
                <option value={4}>1 mot sur 4</option>
                <option value={5}>1 mot sur 5 (standard)</option>
                <option value={7}>1 mot sur 7 (facile)</option>
              </select>
            </div>
            <button
              onClick={exportDocx}
              className="text-xs border border-jfb-bordure px-3 py-1 hover:bg-jfb-beige ml-auto"
              style={{ borderRadius: '2px' }}
            >
              Télécharger .docx
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {trousLines.map(({ label, masked }, i) => {
              const spk = speakers.find(s => s.label === label)
              return (
                <div key={i} className="flex gap-2 items-start">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: spk?.color ?? '#888' }}
                  >
                    {label}
                  </span>
                  <p className="text-jfb-noir leading-relaxed">{masked}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VRAI / FAUX */}
      {activeTab === 'quiz' && (
        <div className="p-5">
          {quizLoading && (
            <p className="text-sm text-jfb-gris">Génération des questions en cours…</p>
          )}
          {quizError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2" style={{ borderRadius: '2px' }}>
              {quizError}
            </p>
          )}
          {quizQuestions && (
            <>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <p className="text-xs text-jfb-gris">5 questions de compréhension</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAnswers(v => !v)}
                    className="text-xs border border-jfb-bordure px-3 py-1 hover:bg-jfb-beige"
                    style={{ borderRadius: '2px' }}
                  >
                    {showAnswers ? 'Masquer corrigé' : 'Afficher corrigé'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="text-xs border border-jfb-bordure px-3 py-1 hover:bg-jfb-beige"
                    style={{ borderRadius: '2px' }}
                  >
                    Imprimer
                  </button>
                </div>
              </div>
              <ol className="space-y-4">
                {quizQuestions.map((q, i) => (
                  <li key={i} className="border border-jfb-bordure p-3" style={{ borderRadius: '2px' }}>
                    <p className="text-sm text-jfb-noir mb-2">{i + 1}. {q.question}</p>
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-1 text-jfb-gris cursor-pointer">
                        <input type="radio" name={`q${i}`} /> Vrai
                      </label>
                      <label className="flex items-center gap-1 text-jfb-gris cursor-pointer">
                        <input type="radio" name={`q${i}`} /> Faux
                      </label>
                    </div>
                    {showAnswers && (
                      <div className="mt-2 bg-jfb-beige px-3 py-2 text-xs" style={{ borderRadius: '2px' }}>
                        <span className="font-bold text-jfb-noir">{q.answer}</span>
                        <span className="text-jfb-gris ml-2">— {q.justification}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              <button
                onClick={() => { setQuizQuestions(null); loadQuiz() }}
                className="mt-4 text-xs text-jfb-gris underline hover:text-jfb-noir"
              >
                Régénérer les questions
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
