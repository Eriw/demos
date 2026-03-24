'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = getSupabase()

    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password, displayName }) => {
    const sb = getSupabase()
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    })
    if (error) throw error
  }

  const signIn = async ({ email, password }) => {
    const sb = getSupabase()
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const sb = getSupabase()
    await sb.auth.signOut()
  }

  const displayName = user?.user_metadata?.display_name || user?.email || ''

  return (
    <AuthContext.Provider value={{ user, loading, displayName, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
