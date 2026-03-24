'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
  const { user, loading, signIn, signUp } = useAuth()
  const router = useRouter()

  const [mode,        setMode]        = useState('signin') // 'signin' | 'signup'
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error,       setError]       = useState('')
  const [info,        setInfo]        = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signUp({ email, password, displayName })
        setInfo('Account created! Check your email to confirm, then sign in. (You can disable email confirmation in your Supabase Auth settings for faster testing.)')
        setMode('signin')
      } else {
        await signIn({ email, password })
        router.replace('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-honey-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-charcoal-900 bg-honeycomb flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-honey-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-honey-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-2">
          <div className="text-7xl">🐝</div>
          <h1 className="text-4xl font-bold text-charcoal-50">
            Hive<span className="text-honey-400">Track</span>
          </h1>
          <p className="text-charcoal-400 text-sm">
            Manage your apiaries, monitor hive health, collaborate with other beekeepers.
          </p>
        </div>

        {/* Card */}
        <div className="bg-charcoal-800/80 backdrop-blur border border-charcoal-700 rounded-2xl p-7 shadow-2xl text-left">
          {/* Tab toggle */}
          <div className="flex rounded-xl bg-charcoal-900/60 p-1 mb-6">
            {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setInfo('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-honey-500 text-charcoal-900'
                    : 'text-charcoal-400 hover:text-charcoal-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-charcoal-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2.5 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-honey-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2.5 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-honey-500"
              />
            </div>
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                required
                minLength={6}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2.5 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-honey-500"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-honey-500 hover:bg-honey-400 disabled:opacity-50 text-charcoal-900 font-semibold text-sm transition-colors mt-1"
            >
              {submitting
                ? (mode === 'signup' ? 'Creating…' : 'Signing in…')
                : (mode === 'signup' ? 'Create Account' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
