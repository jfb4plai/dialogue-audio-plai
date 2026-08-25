'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function AuthWidget() {
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    sb.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = sb.auth.onAuthStateChange((e, session) => {
      if (e === 'PASSWORD_RECOVERY') { setPasswordRecovery(true); setOpen(true) }
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
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        setOpen(false)
      } else if (mode === 'reset') {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setMessage('Email envoyé ! Vérifiez votre boîte mail pour créer un nouveau mot de passe.')
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const sb = getSupabase()
    if (!sb) return
    setError(null)
    if (newPassword.length < 6) { setError('6 caractères minimum.'); return }
    setLoading(true)
    try {
      const { error } = await sb.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordRecovery(false)
      setOpen(false)
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

  if (user && !passwordRecovery) {
    return (
      <div className="flex items-center gap-3 text-xs text-jfb-gris">
        <span className="hidden sm:block">{user.email}</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 border border-jfb-bordure hover:border-jfb-noir hover:text-jfb-noir text-jfb-gris transition-colors"
          style={{ borderRadius: '2px' }}
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
        className="text-xs px-3 py-1 border border-jfb-bordure text-jfb-gris hover:border-jfb-noir hover:text-jfb-noir transition-colors"
        style={{ borderRadius: '2px' }}
      >
        Se connecter
      </button>

      {open && passwordRecovery && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-xl w-full max-w-sm p-6 border border-jfb-bordure" style={{ borderRadius: '2px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-jfb-noir text-sm">Nouveau mot de passe</h2>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <input
                type="password" required placeholder="Nouveau mot de passe" minLength={6}
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-jfb-bordure px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jfb-rose"
                style={{ borderRadius: '2px' }}
              />
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1" style={{ borderRadius: '2px' }}>{error}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full py-2 bg-jfb-noir text-white text-sm font-semibold hover:bg-jfb-noir-doux disabled:opacity-50 transition-colors"
                style={{ borderRadius: '2px' }}
              >
                {loading ? '…' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {open && !passwordRecovery && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-xl w-full max-w-sm p-6 border border-jfb-bordure" style={{ borderRadius: '2px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-jfb-noir text-sm">
                {mode === 'login' ? 'Connexion' : mode === 'reset' ? 'Mot de passe oublié' : 'Créer un compte'}
              </h2>
              <button onClick={() => { setOpen(false); setError(null); setMessage(null) }}
                className="text-jfb-gris hover:text-jfb-noir text-lg leading-none">✕</button>
            </div>

            {message ? (
              <p className="text-sm text-jfb-noir bg-jfb-beige border border-jfb-beige-dk px-3 py-2" style={{ borderRadius: '2px' }}>{message}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email" required placeholder="Email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-jfb-bordure px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jfb-rose"
                  style={{ borderRadius: '2px' }}
                />
                {mode !== 'reset' && (
                  <input
                    type="password" required placeholder="Mot de passe"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full border border-jfb-bordure px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jfb-rose"
                    style={{ borderRadius: '2px' }}
                  />
                )}
                {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1" style={{ borderRadius: '2px' }}>{error}</p>}
                <button
                  type="submit" disabled={loading}
                  className="w-full py-2 bg-jfb-noir text-white text-sm font-semibold hover:bg-jfb-noir-doux disabled:opacity-50 transition-colors"
                  style={{ borderRadius: '2px' }}
                >
                  {loading ? '…' : mode === 'login' ? 'Se connecter' : mode === 'reset' ? 'Envoyer le lien' : 'Créer le compte'}
                </button>
              </form>
            )}

            <p className="mt-3 text-center text-xs text-jfb-gris space-y-1">
              {mode === 'login' && (
                <>
                  <span>Pas encore de compte ?{' '}
                    <button onClick={() => { setMode('register'); setError(null); setMessage(null) }}
                      className="text-jfb-rose hover:underline">S&apos;inscrire</button>
                  </span>
                  <br />
                  <button onClick={() => { setMode('reset'); setError(null); setMessage(null) }}
                    className="text-jfb-gris hover:underline">Mot de passe oublié ?</button>
                </>
              )}
              {mode === 'register' && (
                <>Déjà un compte ?{' '}
                  <button onClick={() => { setMode('login'); setError(null); setMessage(null) }}
                    className="text-jfb-rose hover:underline">Se connecter</button></>
              )}
              {mode === 'reset' && (
                <button onClick={() => { setMode('login'); setError(null); setMessage(null) }}
                  className="text-jfb-rose hover:underline">← Retour à la connexion</button>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
