'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-honey-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-charcoal-900 bg-honeycomb flex flex-col items-center justify-center px-4">
      {/* Glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-honey-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-honey-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <div className="space-y-3">
          <div className="text-7xl">🐝</div>
          <h1 className="text-4xl font-bold text-charcoal-50">
            Hive<span className="text-honey-400">Track</span>
          </h1>
          <p className="text-charcoal-400 text-lg leading-relaxed">
            Manage your apiaries, monitor hive health, and collaborate with other beekeepers — all in one place.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {['Real-time sync', 'Multi-apiary', 'Inspection logs', 'Collaborators'].map(f => (
            <span key={f} className="px-3 py-1 bg-charcoal-800 border border-charcoal-700 rounded-full text-xs text-charcoal-300">
              {f}
            </span>
          ))}
        </div>

        {/* Sign in card */}
        <div className="bg-charcoal-800/80 backdrop-blur border border-charcoal-700 rounded-2xl p-8 shadow-2xl space-y-4">
          <h2 className="text-lg font-semibold text-charcoal-100">Get started</h2>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-medium text-sm shadow transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <p className="text-xs text-charcoal-500">
            Your data is private. Only you and collaborators you invite can see your apiaries.
          </p>
        </div>
      </div>
    </main>
  )
}
