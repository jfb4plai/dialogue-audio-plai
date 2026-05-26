'use client'
import { useState } from 'react'
import { Speaker } from '@/types/dialogue'

interface QuizQuestion {
  question: string
  answer: string
  justification: string
}

interface LexiqueItem {
  word: string
  translation: string
  example: string
  reuse: string
}

interface Props {
  script: string
  locale: string
  speakers: Speaker[]
  niveau?: string
  vocabulaire?: string
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

const TRUE_FALSE_LABELS: Record<string, [string, string]> = {
  nl_BE: ['Waar', 'Niet waar'],
  nl_NL: ['Waar', 'Niet waar'],
  de_DE: ['Wahr', 'Falsch'],
  en_GB: ['True', 'False'],
  es_ES: ['Verdadero', 'Falso'],
  it_IT: ['Vero', 'Falso'],
  fr_FR: ['Vrai', 'Faux'],
  fr_BE: ['Vrai', 'Faux'],
}

function parseLines(script: string): { label: string; content: string }[] {
  return script.split('\n')
    .map(l => l.trim())
    .filter(l => /^[A-D]:\s/.test(l))
    .map(l => ({ label: l[0], content: l.slice(3).trim() }))
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ActivitesDeriveesPanel({ script, locale, speakers, niveau = '', vocabulaire = '' }: Props) {
  const [activeTab, setActiveTab] = useState<'lexique' | 'trous' | 'quiz' | null>(null)

  // Texte à trous
  const [every, setEvery] = useState(5)
  const [maxLines, setMaxLines] = useState(0)

  // Vrai / Faux
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [quizLang, setQuizLang] = useState<'fr' | 'locale'>('fr')

  // Lexique
  const [lexiqueItems, setLexiqueItems] = useState<LexiqueItem[] | null>(null)
  const [lexiqueLoading, setLexiqueLoading] = useState(false)
  const [lexiqueError, setLexiqueError] = useState<string | null>(null)
  const [lexiqueChecked, setLexiqueChecked] = useState<Set<number>>(new Set())

  const lines = parseLines(script)
  const displayedLines = maxLines > 0 ? lines.slice(0, maxLines) : lines
  const trousLines = makeTrous(displayedLines, every)
  const [trueLabel, falseLabel] = quizLang === 'locale'
    ? (TRUE_FALSE_LABELS[locale] ?? ['Vrai', 'Faux'])
    : ['Vrai', 'Faux']

  const loadQuiz = async () => {
    if (quizLoading) return
    setQuizLoading(true)
    setQuizError(null)
    setQuizQuestions(null)
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, locale, question_lang: quizLang }),
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

  const loadLexique = async () => {
    if (lexiqueLoading) return
    setLexiqueLoading(true)
    setLexiqueError(null)
    setLexiqueItems(null)
    try {
      const res = await fetch('/api/generate-lexique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, locale, niveau, vocabulaire }),
      })
      const data = await res.json()
      if (data.error) { setLexiqueError(data.error); return }
      setLexiqueItems(data.items)
      setLexiqueChecked(new Set(data.items.map((_: LexiqueItem, i: number) => i)))
    } catch {
      setLexiqueError('Erreur réseau.')
    } finally {
      setLexiqueLoading(false)
    }
  }

  const exportTrousDocx = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
    const children = [
      new Paragraph({ text: 'Texte à trous', heading: HeadingLevel.HEADING_1 }),
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
    children.push(new Paragraph({ children: [new TextRun({ text: '' })], pageBreakBefore: true }))
    children.push(new Paragraph({ text: 'Corrigé', heading: HeadingLevel.HEADING_1 }))
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
    downloadBlob(await Packer.toBlob(doc), 'texte-a-trous.docx')
  }

  const exportQuizDocx = async () => {
    if (!quizQuestions) return
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
    const children = [
      new Paragraph({ text: 'Vrai / Faux', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: '' }),
    ]
    quizQuestions.forEach((q, i) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${q.question}` })] }))
      children.push(new Paragraph({ children: [new TextRun({ text: `\u25CB ${trueLabel}     \u25CB ${falseLabel}` })] }))
      children.push(new Paragraph({ text: '' }))
    })
    children.push(new Paragraph({ children: [new TextRun({ text: '' })], pageBreakBefore: true }))
    children.push(new Paragraph({ text: 'Corrigé', heading: HeadingLevel.HEADING_1 }))
    children.push(new Paragraph({ text: '' }))
    quizQuestions.forEach((q, i) => {
      const ans = q.answer === 'Vrai' ? trueLabel : falseLabel
      children.push(new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${q.question}` })],
      }))
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `→ ${ans}`, bold: true }),
          new TextRun({ text: `  — ${q.justification}`, italics: true }),
        ],
      }))
      children.push(new Paragraph({ text: '' }))
    })
    const doc = new Document({ sections: [{ children }] })
    downloadBlob(await Packer.toBlob(doc), 'vrai-faux.docx')
  }

  const exportLexiqueDocx = async () => {
    if (!lexiqueItems) return
    const selected = lexiqueItems.filter((_, i) => lexiqueChecked.has(i))
    if (selected.length === 0) return
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = await import('docx')
    const bs = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
    const borders = { top: bs, bottom: bs, left: bs, right: bs }

    const hCell = (text: string) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
      borders,
    })
    const cell = (text: string, italic = false) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, italics: italic })] })],
      borders,
    })

    // Fiche élève : mot | traduction | réemploi (avec ___)
    const studentRows = [
      new TableRow({ children: [hCell('Mot'), hCell('Traduction'), hCell('Réemploi (complète le blanc)')] }),
      ...selected.map(item => new TableRow({
        children: [cell(item.word), cell(item.translation), cell(item.reuse)],
      })),
    ]

    // Corrigé enseignant : mot | traduction | exemple | réemploi
    const teacherRows = [
      new TableRow({ children: [hCell('Mot'), hCell('Traduction'), hCell('Exemple du dialogue'), hCell('Réemploi')] }),
      ...selected.map(item => new TableRow({
        children: [cell(item.word), cell(item.translation), cell(item.example, true), cell(item.reuse)],
      })),
    ]

    const children = [
      new Paragraph({ text: 'Lexique — fiche élève', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: '' }),
      new Table({ rows: studentRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
      new Paragraph({ children: [new TextRun({ text: '' })], pageBreakBefore: true }),
      new Paragraph({ text: 'Lexique — corrigé enseignant', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: '' }),
      new Table({ rows: teacherRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
    ]
    const doc = new Document({ sections: [{ children }] })
    downloadBlob(await Packer.toBlob(doc), 'lexique.docx')
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
          {tabBtn('lexique', 'Lexique', loadLexique)}
          {tabBtn('trous', 'Texte à trous')}
          {tabBtn('quiz', 'Vrai / Faux')}
        </div>
      </div>

      {/* LEXIQUE */}
      {activeTab === 'lexique' && (
        <div className="p-5">
          {lexiqueLoading && <p className="text-sm text-jfb-gris">Génération du lexique en cours…</p>}
          {lexiqueError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2" style={{ borderRadius: '2px' }}>
              {lexiqueError}
            </p>
          )}
          {lexiqueItems && (
            <>
              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <p className="text-xs text-jfb-gris">
                  {lexiqueChecked.size}/{lexiqueItems.length} mots sélectionnés — décochez les mots à exclure
                </p>
                <div className="flex gap-2">
                  <button onClick={exportLexiqueDocx}
                    disabled={lexiqueChecked.size === 0}
                    className="text-xs border border-jfb-bordure px-3 py-1 hover:bg-jfb-beige disabled:opacity-40"
                    style={{ borderRadius: '2px' }}>
                    Télécharger .docx ({lexiqueChecked.size})
                  </button>
                  <button onClick={() => { setLexiqueItems(null); setLexiqueChecked(new Set()); loadLexique() }}
                    className="text-xs text-jfb-gris underline hover:text-jfb-noir">
                    Régénérer
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-jfb-beige">
                      <th className="px-2 py-2 border border-jfb-bordure w-8">
                        <input type="checkbox"
                          checked={lexiqueChecked.size === lexiqueItems.length}
                          onChange={e => setLexiqueChecked(e.target.checked ? new Set(lexiqueItems.map((_, i) => i)) : new Set())}
                          className="accent-jfb-rose" />
                      </th>
                      <th className="text-left px-3 py-2 border border-jfb-bordure font-medium text-jfb-noir">Mot</th>
                      <th className="text-left px-3 py-2 border border-jfb-bordure font-medium text-jfb-noir">Traduction</th>
                      <th className="text-left px-3 py-2 border border-jfb-bordure font-medium text-jfb-noir">Exemple du dialogue</th>
                      <th className="text-left px-3 py-2 border border-jfb-bordure font-medium text-jfb-noir">Réemploi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lexiqueItems.map((item, i) => {
                      const checked = lexiqueChecked.has(i)
                      return (
                        <tr key={i} className={`${checked ? '' : 'opacity-40'} ${i % 2 === 0 ? '' : 'bg-jfb-subtil'}`}>
                          <td className="px-2 py-2 border border-jfb-bordure text-center">
                            <input type="checkbox" checked={checked}
                              onChange={e => {
                                const next = new Set(lexiqueChecked)
                                e.target.checked ? next.add(i) : next.delete(i)
                                setLexiqueChecked(next)
                              }}
                              className="accent-jfb-rose" />
                          </td>
                          <td className="px-3 py-2 border border-jfb-bordure font-medium text-jfb-noir">{item.word}</td>
                          <td className="px-3 py-2 border border-jfb-bordure text-jfb-gris">{item.translation}</td>
                          <td className="px-3 py-2 border border-jfb-bordure text-jfb-gris text-xs italic">«&#8201;{item.example}&#8201;»</td>
                          <td className="px-3 py-2 border border-jfb-bordure text-jfb-gris text-xs">{item.reuse}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* TEXTE À TROUS */}
      {activeTab === 'trous' && (
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-jfb-gris">Difficulté :</label>
              <select value={every} onChange={e => setEvery(Number(e.target.value))}
                className="text-sm border border-jfb-bordure px-2 py-1 bg-white" style={{ borderRadius: '2px' }}>
                <option value={3}>1 mot sur 3 (difficile)</option>
                <option value={4}>1 mot sur 4</option>
                <option value={5}>1 mot sur 5 (standard)</option>
                <option value={7}>1 mot sur 7 (facile)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-jfb-gris">Répliques :</label>
              <select value={maxLines} onChange={e => setMaxLines(Number(e.target.value))}
                className="text-sm border border-jfb-bordure px-2 py-1 bg-white" style={{ borderRadius: '2px' }}>
                <option value={0}>Tout ({lines.length} répliques)</option>
                <option value={10}>10 premières</option>
                <option value={15}>15 premières</option>
                <option value={20}>20 premières</option>
              </select>
            </div>
            <button onClick={exportTrousDocx}
              className="text-xs border border-jfb-bordure px-3 py-1 hover:bg-jfb-beige ml-auto"
              style={{ borderRadius: '2px' }}>
              Télécharger .docx
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {trousLines.map(({ label, masked }, i) => {
              const spk = speakers.find(s => s.label === label)
              return (
                <div key={i} className="flex gap-2 items-start">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: spk?.color ?? '#888' }}>
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
          {/* Langue + actions */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-jfb-gris">Questions en :</span>
            {(['fr', 'locale'] as const).map(lang => (
              <button key={lang}
                onClick={() => { setQuizLang(lang); setQuizQuestions(null); setQuizError(null) }}
                className={`text-xs px-3 py-1 border transition-colors ${
                  quizLang === lang
                    ? 'bg-jfb-noir text-white border-jfb-noir'
                    : 'bg-white text-jfb-noir border-jfb-bordure hover:bg-jfb-beige'
                }`}
                style={{ borderRadius: '2px' }}>
                {lang === 'fr' ? 'Français' : 'Langue cible'}
              </button>
            ))}
          </div>

          {/* Generate button */}
          {!quizQuestions && !quizLoading && (
            <button onClick={loadQuiz}
              className="text-sm px-4 py-2 bg-jfb-noir text-white hover:opacity-90 mb-4"
              style={{ borderRadius: '2px' }}>
              Générer les questions
            </button>
          )}

          {quizLoading && <p className="text-sm text-jfb-gris">Génération des questions en cours…</p>}
          {quizError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2" style={{ borderRadius: '2px' }}>
              {quizError}
            </p>
          )}

          {quizQuestions && (
            <div>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <p className="text-xs text-jfb-gris">5 questions de compréhension</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowAnswers(v => !v)}
                    className="text-xs border border-jfb-bordure px-3 py-1 hover:bg-jfb-beige"
                    style={{ borderRadius: '2px' }}>
                    {showAnswers ? 'Masquer corrigé' : 'Afficher corrigé'}
                  </button>
                  <button onClick={exportQuizDocx}
                    className="text-xs border border-jfb-bordure px-3 py-1 hover:bg-jfb-beige"
                    style={{ borderRadius: '2px' }}>
                    Télécharger .docx
                  </button>
                </div>
              </div>
              <ol className="space-y-4">
                {quizQuestions.map((q, i) => (
                  <li key={i} className="border border-jfb-bordure p-3" style={{ borderRadius: '2px' }}>
                    <p className="text-sm text-jfb-noir mb-2">{i + 1}. {q.question}</p>
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-1 text-jfb-gris cursor-pointer">
                        <input type="radio" name={`q${i}`} /> {trueLabel}
                      </label>
                      <label className="flex items-center gap-1 text-jfb-gris cursor-pointer">
                        <input type="radio" name={`q${i}`} /> {falseLabel}
                      </label>
                    </div>
                    {showAnswers && (
                      <div className="mt-2 bg-jfb-beige px-3 py-2 text-xs" style={{ borderRadius: '2px' }}>
                        <span className="font-bold text-jfb-noir">
                          {q.answer === 'Vrai' ? trueLabel : falseLabel}
                        </span>
                        <span className="text-jfb-gris ml-2">— {q.justification}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              <button onClick={() => { setQuizQuestions(null); loadQuiz() }}
                className="mt-4 text-xs text-jfb-gris underline hover:text-jfb-noir">
                Régénérer les questions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
