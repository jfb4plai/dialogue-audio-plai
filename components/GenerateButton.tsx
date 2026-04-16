'use client'
import { useState } from 'react'

const STEPS = [
  'Connexion au serveur TTS...',
  'Téléchargement des modèles vocaux...',
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

  const handleClick = async () => {
    setLoading(true)
    setTimedOut(false)
    setElapsed(0)

    let stepIdx = 0
    setStep(STEPS[0])

    // Cycle through steps roughly every 8s to give feedback
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
    } catch {
      setStep('Erreur lors de la génération')
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
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Génération en cours...' : 'Générer le dialogue audio'}
      </button>
      {loading && (
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="animate-spin">⟳</span>
            <span>{step}</span>
          </div>
          <div className="text-xs text-gray-400">{elapsed}s écoulées</div>
          {timedOut && (
            <div className="text-xs text-amber-600 mt-1">
              Le serveur TTS est en cours de démarrage, cela peut prendre jusqu&apos;à 2 minutes lors de la première utilisation.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
