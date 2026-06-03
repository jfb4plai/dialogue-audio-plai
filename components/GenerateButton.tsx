'use client'
import { useState } from 'react'

interface Props {
  onGenerate: () => Promise<void>
  disabled: boolean
  engine?: string          // 'piper' | 'edge-tts' | 'gemini' | 'azure'
  replicaCount?: number    // number of répliques in script
}

function getProgressMessage(elapsed: number): string {
  if (elapsed < 60) return 'Génération en cours — ne fermez pas la page'
  if (elapsed < 240) return 'Plus lent que prévu — le serveur continue, ne fermez pas la page.'
  return 'Génération longue détectée. Si aucun résultat dans 30 secondes, rechargez et réessayez.'
}

function getEstimate(engine: string | undefined, count: number | undefined): string {
  if (!count) return ''
  if (engine === 'edge-tts' || engine === 'azure') return '~15–30s'
  if (engine === 'gemini') return count > 25 ? '~2–4 min' : '~30–60s'
  return '~30–90s'
}

export default function GenerateButton({ onGenerate, disabled, engine, replicaCount }: Props) {
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setDone(false)
    setElapsed(0)
    setErrorMsg(null)

    const timer = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)

    try {
      await onGenerate()
      setDone(true)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  const estimate = getEstimate(engine, replicaCount)

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

      {!loading && !done && estimate && (
        <p className="mt-2 text-xs text-jfb-gris-cl">
          Durée estimée : {estimate}
        </p>
      )}

      {loading && (
        <div className="mt-3 text-sm text-jfb-gris space-y-1">
          <div className="flex items-center gap-2">
            <span className="animate-spin">⟳</span>
            <span>{getProgressMessage(elapsed)}</span>
          </div>
          <div className="text-xs text-jfb-gris-cl">{elapsed}s écoulées</div>
        </div>
      )}

      {done && (
        <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2" style={{ borderRadius: '2px' }}>
          Terminé ✓
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
