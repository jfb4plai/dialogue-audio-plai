'use client'
import { useState } from 'react'

const STEPS = [
  'Connexion au serveur TTS...',
  'Synthèse vocale en cours...',
  'Génération des répliques...',
  'Assemblage de l\'audio...',
  'Upload sur archive.org...',
  'Création du QR code...',
  'Terminé ✓',
]

interface Props {
  onGenerate: () => Promise<void>
  disabled: boolean
}

export default function GenerateButton({ onGenerate, disabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setTimedOut(false)
    setElapsed(0)
    setErrorMsg(null)

    let stepIdx = 0
    setStep(STEPS[0])

    const stepInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEPS.length - 2)
      setStep(STEPS[stepIdx])
    }, 8000)

    const timer = setInterval(() => {
      setElapsed(prev => {
        if (prev >= 120) setTimedOut(true)
        return prev + 1
      })
    }, 1000)

    try {
      await onGenerate()
      setStep(STEPS[STEPS.length - 1])
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      clearInterval(stepInterval)
      clearInterval(timer)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full text-white font-semibold py-3 transition-colors"
        style={{
          borderRadius: '2px',
          backgroundColor: disabled || loading ? '#5a5a5a' : '#FF3399',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Génération en cours...' : 'Générer le dialogue audio'}
      </button>
      {loading && (
        <div className="mt-3 text-sm text-jfb-gris space-y-1">
          <div className="flex items-center gap-2">
            <span className="animate-spin">⟳</span>
            <span>{step}</span>
          </div>
          <div className="text-xs text-jfb-gris-cl">{elapsed}s écoulées</div>
          {elapsed >= 5 && !timedOut && (
            <div className="text-xs text-jfb-gris-cl mt-1">
              La génération prend généralement 30 à 90 secondes selon la longueur du dialogue.
            </div>
          )}
          {timedOut && (
            <div className="text-xs text-amber-600 mt-1">
              Le serveur TTS est en cours de démarrage — cela peut prendre jusqu&apos;à 2 minutes lors de la première utilisation.
            </div>
          )}
        </div>
      )}
      {errorMsg && (() => {
        const isQuota = errorMsg.includes('journalier') || errorMsg.includes('per_model_per_day') || errorMsg.includes('PerDay')
        return (
          <div className={`mt-3 text-sm px-3 py-2 border ${isQuota ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200'}`} style={{ borderRadius: '2px' }}>
            {isQuota ? (
              <>
                <strong>Quota journalier atteint.</strong>{' '}
                {errorMsg.match(/Réessayez dans [\w]+/)?.[0] ?? 'Réessayez demain.'}{' '}
                La génération Gemini TTS est limitée à 100 appels/jour sur le plan gratuit.
              </>
            ) : errorMsg}
          </div>
        )
      })()}
    </div>
  )
}
