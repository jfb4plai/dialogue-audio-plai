'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { useWizard } from '@/lib/wizard-context'
import { DialogueRecord } from '@/types/dialogue'

export default function HistoryPanel() {
  const [records, setRecords] = useState<DialogueRecord[]>([])
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const { dispatch } = useWizard()
  const router = useRouter()

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return

    const load = async () => {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data } = await sb
        .from('dialogues')
        .select('id, language, script_text, speakers, audio_url, duration_seconds, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setRecords(data as DialogueRecord[])
    }

    load()

    const { data: listener } = sb.auth.onAuthStateChange(() => load())
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleReuse = (record: DialogueRecord) => {
    dispatch({ type: 'SET_MODE', payload: 'dialogue' })
    dispatch({ type: 'SET_LOCALE', payload: record.language })
    if (record.speakers?.length) {
      dispatch({ type: 'SET_SPEAKERS', payload: record.speakers })
    }
    dispatch({ type: 'SET_SCRIPT', payload: record.script_text })
    router.push('/studio/script')
  }

  const handleDelete = async (id: string) => {
    const sb = getSupabase()
    if (!sb) return
    await sb.from('dialogues').delete().eq('id', id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const handleClearAll = async () => {
    const sb = getSupabase()
    if (!sb) return
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    await sb.from('dialogues').delete().eq('user_id', user.id)
    setRecords([])
    setConfirmClearAll(false)
  }

  if (records.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-700">Mes dialogues récents</h2>
        {confirmClearAll ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-jfb-gris">Supprimer tout ?</span>
            <button
              onClick={handleClearAll}
              className="text-red-600 border border-red-300 px-2 py-0.5 hover:bg-red-50 transition-colors"
              style={{ borderRadius: '2px' }}
            >
              Confirmer
            </button>
            <button
              onClick={() => setConfirmClearAll(false)}
              className="text-jfb-gris border border-jfb-bordure px-2 py-0.5 hover:border-jfb-noir transition-colors"
              style={{ borderRadius: '2px' }}
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClearAll(true)}
            className="text-xs text-jfb-gris-cl hover:text-red-500 transition-colors"
          >
            Tout effacer
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {records.map(r => (
          <li key={r.id} className="flex items-center justify-between bg-white border border-jfb-bordure px-4 py-2 text-sm" style={{ borderRadius: '2px' }}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-jfb-noir text-xs uppercase">{r.language}</span>
                <span className="text-jfb-gris-cl text-xs">
                  {new Date(r.created_at).toLocaleDateString('fr-BE')}
                </span>
                {r.duration_seconds && (
                  <span className="text-jfb-gris-cl text-xs">
                    {(() => { const s = Math.round(r.duration_seconds as number); return s >= 60 ? `${Math.floor(s/60)}min${s%60}s` : `${s}s` })()}
                  </span>
                )}
              </div>
              {r.script_text && (
                <p className="text-xs text-jfb-gris truncate mt-0.5">
                  {r.script_text.replace(/^[A-D]:\s*/gm, '').replace(/\n/g, ' · ').substring(0, 80)}
                </p>
              )}
            </div>
            <div className="ml-3 flex-shrink-0 flex items-center gap-3">
              <button
                onClick={() => handleReuse(r)}
                className="text-xs text-jfb-gris border border-jfb-bordure px-2 py-1 hover:border-jfb-noir hover:text-jfb-noir transition-colors"
                style={{ borderRadius: '2px' }}
                title="Recharger ce script dans l'éditeur pour le modifier"
              >
                Réutiliser
              </button>
              {r.audio_url && (
                <a href={r.audio_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-jfb-rose hover:underline">
                  Écouter
                </a>
              )}
              <button
                onClick={() => handleDelete(r.id)}
                className="text-xs text-jfb-gris-cl hover:text-red-500 transition-colors"
                title="Supprimer ce dialogue"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
