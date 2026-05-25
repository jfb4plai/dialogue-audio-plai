'use client'
import { usePathname, useRouter } from 'next/navigation'

const STEPS = [
  { label: 'Type',          path: '/studio/type' },
  { label: 'Configuration', path: '/studio/config' },
  { label: 'Script',        path: '/studio/script' },
  { label: 'Résultat',      path: '/studio/result' },
]

export default function WizardStepper() {
  const pathname = usePathname()
  const router = useRouter()
  const currentIndex = STEPS.findIndex(s => pathname.startsWith(s.path))

  const goBack = () => {
    if (currentIndex > 0) router.push(STEPS[currentIndex - 1].path)
  }

  return (
    <div className="bg-white border-b border-jfb-bordure px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center gap-3">

        {/* Bouton retour */}
        {currentIndex > 0 && (
          <button
            onClick={goBack}
            className="flex-shrink-0 text-jfb-gris hover:text-jfb-noir text-sm flex items-center gap-1 border border-jfb-bordure px-2 py-1 hover:border-jfb-noir transition-colors"
            style={{ borderRadius: '2px' }}
            aria-label="Étape précédente"
          >
            ← Retour
          </button>
        )}

        {/* Steps */}
        <div className="flex items-center gap-0 flex-1 min-w-0">
          {STEPS.map((step, i) => {
            const isDone    = i < currentIndex
            const isCurrent = i === currentIndex
            const isLast    = i === STEPS.length - 1
            return (
              <div key={step.path} className="flex items-center min-w-0">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Pastille */}
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      isCurrent ? 'bg-jfb-rose text-white'
                      : isDone  ? 'bg-jfb-noir text-white'
                      :           'bg-jfb-bordure text-jfb-gris-cl'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </span>
                  {/* Label — masqué sur mobile sauf étape courante */}
                  <span
                    className={`text-[11px] font-medium hidden sm:block ${
                      isCurrent ? 'text-jfb-rose'
                      : isDone  ? 'text-jfb-noir'
                      :           'text-jfb-gris-cl'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {/* Séparateur */}
                {!isLast && (
                  <div className={`h-px w-6 mx-1.5 flex-shrink-0 ${isDone ? 'bg-jfb-noir' : 'bg-jfb-bordure'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Étape X/4 sur mobile */}
        <span className="flex-shrink-0 text-[11px] text-jfb-gris-cl sm:hidden">
          {currentIndex + 1}/{STEPS.length}
        </span>
      </div>
    </div>
  )
}
