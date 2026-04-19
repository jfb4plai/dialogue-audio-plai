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
          <li key={r.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm">
            <div>
              <span className="font-medium text-gray-800">{r.language.toUpperCase()}</span>
              <span className="text-gray-400 ml-2 text-xs">
                {new Date(r.created_at).toLocaleDateString('fr-BE')}
              </span>
              {r.duration_seconds && (
                <span className="text-gray-400 ml-2 text-xs">{r.duration_seconds}s</span>
              )}
            </div>
            {r.audio_url && (
              <a href={r.audio_url} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs">
                Écouter
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
