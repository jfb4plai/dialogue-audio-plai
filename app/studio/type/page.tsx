'use client'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/lib/wizard-context'

export default function TypePage() {
  const { dispatch, reset } = useWizard()
  const router = useRouter()

  const choose = (mode: 'dialogue' | 'podcast') => {
    reset()
    dispatch({ type: 'SET_MODE', payload: mode })
    router.push('/studio/config')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-jfb-noir">Que souhaitez-vous créer ?</h1>
        <p className="text-jfb-gris text-sm mt-2">
          Choisissez le format audio — dialogue court ou podcast structuré
        </p>
      </div>

      <div className="mb-6 text-xs text-jfb-gris bg-amber-50 border border-amber-200 px-3 py-2 leading-relaxed" style={{ borderRadius: '2px' }}>
        L&apos;audio généré est hébergé publiquement sur <strong>Internet Archive</strong>. Ne pas inclure de données personnelles (noms d&apos;élèves, informations privées) dans les scripts.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Dialogue */}
        <button
          onClick={() => choose('dialogue')}
          className="group text-left border-2 border-jfb-bordure bg-white p-6 hover:border-jfb-rose hover:shadow-sm transition-all"
          style={{ borderRadius: '2px' }}
        >
          <div className="text-3xl mb-3">🎙</div>
          <h2 className="text-lg font-bold text-jfb-noir mb-1 group-hover:text-jfb-rose transition-colors">
            Dialogue
          </h2>
          <p className="text-sm text-jfb-gris leading-relaxed">
            Échange entre 2 à 4 locuteurs. Idéal pour des exercices de compréhension orale, simulations de situations professionnelles, monologues.
          </p>
          <ul className="mt-4 space-y-1 text-xs text-jfb-gris-cl">
            <li>· Voix génératives IA</li>
            <li>· Jusqu&apos;à 60 répliques (~3 min)</li>
            <li>· Script IA ou texte libre</li>
          </ul>
        </button>

        {/* Podcast */}
        <button
          onClick={() => choose('podcast')}
          className="group text-left border-2 border-jfb-bordure bg-white p-6 hover:border-jfb-rose hover:shadow-sm transition-all"
          style={{ borderRadius: '2px' }}
        >
          <div className="text-3xl mb-3">🎧</div>
          <h2 className="text-lg font-bold text-jfb-noir mb-1 group-hover:text-jfb-rose transition-colors">
            Podcast
          </h2>
          <p className="text-sm text-jfb-gris leading-relaxed">
            Format long avec animateur et invités. Script généré depuis un document (PDF ou Word). Voix Gemini avec profils personnalisés.
          </p>
          <ul className="mt-4 space-y-1 text-xs text-jfb-gris-cl">
            <li>· Voix génératives IA</li>
            <li>· Jusqu&apos;à 4 locuteurs</li>
            <li>· IA à partir d&apos;un document uploadé</li>
          </ul>
          <div className="mt-3 inline-block text-[10px] bg-jfb-beige text-jfb-gris px-2 py-0.5 border border-jfb-beige-dk" style={{ borderRadius: '2px' }}>
            Limite 3 min · podcasts longs en V2
          </div>
        </button>
      </div>
    </main>
  )
}
