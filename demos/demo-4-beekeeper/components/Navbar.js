'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import Image from 'next/image'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'My Apiaries' },
    { href: '/activity',  label: 'Activity Feed' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-charcoal-800/95 backdrop-blur border-b border-charcoal-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <span className="text-2xl">🐝</span>
            <span className="text-honey-400 font-bold text-lg tracking-tight group-hover:text-honey-300 transition-colors">
              HiveTrack
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-honey-500/20 text-honey-300'
                      : 'text-charcoal-300 hover:text-honey-300 hover:bg-charcoal-700'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full ring-2 ring-honey-500/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-honey-600 flex items-center justify-center text-white text-sm font-bold">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-charcoal-300 text-sm">{user.displayName || user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-lg text-sm text-charcoal-400 hover:text-honey-300 hover:bg-charcoal-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex gap-1 pb-2">
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 text-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-honey-500/20 text-honey-300'
                    : 'text-charcoal-300 hover:text-honey-300 hover:bg-charcoal-700'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
