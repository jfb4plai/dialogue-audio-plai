'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWizard } from '@/lib/wizard-context'
import AudioResult from '@/components/AudioResult'
import ActivitesDeriveesPanel from '@/components/ActivitesDeriveesPanel'
import HistoryPanel from '@/components/HistoryPanel'

export default function ResultPage() {
  const { state, reset, isHydrated } = useWizard()
  const router = useRouter()
  const { mode, result, script, locale, speakers } = state

  // Garde-fou
  useEffect(() => {
    if (isHydrated && !result) router.replace('/studio/type')
  }, [isHydrated, result, router])

  if (!isHydrated || !result) return null

  const handleNew = () => {
    reset()
    router.push('/studio/type')
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-jfb-noir capitalize">{mode} — Audio généré</h1>
          <p className="text-jfb-gris text-sm mt-1">Écoutez, téléchargez, partagez via QR code</p>
        </div>
        <button
          onClick={handleNew}
          className="text-sm px-4 py-2 border border-jfb-bordure text-jfb-gris hover:border-jfb-noir hover:text-jfb-noir transition-colors"
          style={{ borderRadius: '2px' }}
        >
          + Nouveau
        </button>
      </div>

      {/* Lecteur + QR + téléchargements */}
      <AudioResult result={result} />

      {/* Exercices dérivés */}
      <ActivitesDeriveesPanel script={script} locale={locale} speakers={speakers} />

      {/* Historique */}
      <HistoryPanel />

      {/* Ancrage scientifique */}
      <div className="mt-8 border border-jfb-bordure bg-jfb-beige p-5" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
        <h2 className="text-sm font-bold text-jfb-noir mb-1">Ancrage scientifique</h2>
        <p className="text-xs text-jfb-gris mb-3">
          Deux axes documentés dans le corpus RISS (522 627 articles scientifiques francophones) :
          l&apos;efficacité des dialogues audio pour l&apos;acquisition en LVE, et l&apos;importance de
          contextualiser l&apos;apprentissage dans le domaine professionnel.
        </p>
        <p className="text-xs font-semibold text-jfb-rose mb-1 uppercase tracking-[0.12em]">Axe 1 — Dialogues audio et acquisition en LVE</p>
        <ul className="space-y-2 text-xs text-jfb-noir mb-4">
          <li><strong>Écoute-acquisition</strong> — L&apos;écoute orientée vers la production favorise l&apos;ancrage lexical et phonologique.<span className="block text-jfb-gris-cl mt-0.5">Évrard, 2017 · RISS dumas-01760327</span></li>
          <li><strong>Familiarisation phonologique</strong> — Exposer l&apos;oreille à des sonorités nouvelles est une priorité de l&apos;enseignement des LVE.<span className="block text-jfb-gris-cl mt-0.5">Bazelaire, 2012 · RISS dumas-00765301</span></li>
          <li><strong>Document sonore en classe</strong> — Les activités de pré- et post-écoute structurent les transactions didactiques en classe de langue.<span className="block text-jfb-gris-cl mt-0.5">Forest &amp; Gruson, 2011 · RISS hal-04050423</span></li>
          <li><strong>Prosodie et compréhension L2</strong> — L&apos;entraînement répété à l&apos;écoute de dialogues réduit les obstacles prosodiques en L2.<span className="block text-jfb-gris-cl mt-0.5">Bidenti, 2024 · RISS dumas-04828505</span></li>
          <li><strong>Acquisition lexicale</strong> — Une exposition sonore structurée améliore l&apos;acquisition du lexique en L2.<span className="block text-jfb-gris-cl mt-0.5">Jouannaud, 2021 · RISS tel-03235381</span></li>
        </ul>
        <p className="text-xs font-semibold text-jfb-rose mb-1 uppercase tracking-[0.12em]">Axe 2 — Contextualisation et motivation en filière professionnelle</p>
        <ul className="space-y-2 text-xs text-jfb-noir">
          <li><strong>Contextualisation en lycée professionnel</strong> — Ancrer les apprentissages dans la filière métier mobilise les apprenants.<span className="block text-jfb-gris-cl mt-0.5">Payet, 2022 · RISS dumas-03984644</span></li>
          <li><strong>Langue sur objectifs spécifiques</strong> — L&apos;ancrage dans le domaine professionnel rend le curriculum plus opérationnel.<span className="block text-jfb-gris-cl mt-0.5">Sowa, 2022 · RISS W4225401879</span></li>
          <li><strong>Motivation intrinsèque</strong> — L&apos;intérêt attribué à une tâche est un levier direct de motivation en LVE.<span className="block text-jfb-gris-cl mt-0.5">Desaivres &amp; Davoli, 2025 · RISS dumas-05216415</span></li>
          <li><strong>Productions concrètes et engagement</strong> — La dimension contextualisée est un levier de motivation spécifique aux élèves de lycée professionnel.<span className="block text-jfb-gris-cl mt-0.5">Eucat, Khadraoui &amp; Dahman, 2023 · RISS dumas-04676095</span></li>
          <li><strong>Dimension professionnelle en cours de langue</strong> — Intégrer le contexte métier a un effet positif sur l&apos;engagement.<span className="block text-jfb-gris-cl mt-0.5">Leglinel Conti, 2021 · RISS dumas-03699714</span></li>
        </ul>
        <p className="mt-3 text-xs text-jfb-gris-cl italic">Sources vérifiées dans le corpus RISS — 522 627 articles scientifiques francophones.</p>
      </div>
    </main>
  )
}
