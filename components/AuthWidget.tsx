'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function AuthWidget() {
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    sb.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sb = getSupabase()
    if (!sb) return
    setLoading(true)
    setError(null)
    setMessage(null)
    if (!sb) {
      setError('Service non disponible (Supabase non configuré).')
      setLoading(false)
      return
    }
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        setOpen(false)
      } else {
        const { error } = await sb.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Vérifiez votre email pour confirmer votre inscription.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const sb = getSupabase()
    if (!sb) return
    await sb.auth.signOut()
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span className="hidden sm:block">{user.email}</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700"
        >
          Déconnexion
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
      >
        Se connecter
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">
                {mode === 'login' ? 'Connexion' : 'Créer un compte'}
              </h2>
              <button onClick={() => { setOpen(false); setError(null); setMessage(null) }}
                className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {message ? (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{message}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email" required placeholder="Email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="password" required placeholder="Mot de passe"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit" disabled={loading}
                  className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
                </button>
              </form>
            )}

            <p className="mt-3 text-center text-xs text-gray-500">
              {mode === 'login' ? (
                <>Pas encore de compte ?{' '}
                  <button onClick={() => { setMode('register'); setError(null) }}
                    className="text-blue-600 hover:underline">S&apos;inscrire</button></>
              ) : (
                <>Déjà un compte ?{' '}
                  <button onClick={() => { setMode('login'); setError(null) }}
                    className="text-blue-600 hover:underline">Se connecter</button></>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
