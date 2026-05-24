'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { DialogueRecord } from '@/types/dialogue'

export default function HistoryPanel() {
  const [records, setRecords] = useState<DialogueRecord[]>([])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return

    const load = async () => {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data } = await sb
        .from('dialogues')
        .select('id, language, script_text, audio_url, duration_seconds, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setRecords(data as DialogueRecord[])
    }

    load()

    const { data: listener } = sb.auth.onAuthStateChange(() => load())
    return () => listener.subscription.unsubscribe()
  }, [])

  if (records.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-gray-700 mb-3">Mes dialogues récents</h2>
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
            {r.audio_url && (
              <a href={r.audio_url} target="_blank" rel="noopener noreferrer"
                className="ml-3 flex-shrink-0 text-xs text-jfb-rose hover:underline">
                Écouter
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
