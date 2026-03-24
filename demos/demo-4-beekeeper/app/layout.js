import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata = {
  title:       'HiveTrack – Beekeeper Management',
  description: 'Track your apiaries, hives, and inspections in real time.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-charcoal-900 text-charcoal-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
