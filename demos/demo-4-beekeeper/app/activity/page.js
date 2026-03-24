'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  collection, query, where, onSnapshot, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { format } from 'date-fns'

function ActivityItem({ item, hiveMap, gardenMap }) {
  const ts = item.timestamp instanceof Timestamp
    ? item.timestamp.toDate()
    : item.timestamp?.seconds
      ? new Date(item.timestamp.seconds * 1000)
      : new Date()

  const hive   = hiveMap[item.hiveId]
  const garden = gardenMap[item.gardenId]

  return (
    <div className="flex gap-4 group">
      {/* Avatar */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-honey-700/30 border border-honey-600/30 flex items-center justify-center text-sm font-bold text-honey-400 mt-0.5">
        {(item.authorName || '?')[0].toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-5 border-b border-charcoal-800">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
          <span className="text-sm font-semibold text-honey-400">{item.authorName}</span>
          <span className="text-xs text-charcoal-500">logged an inspection on</span>
          {hive ? (
            <Link href={`/hive/${item.hiveId}`} className="text-sm font-medium text-charcoal-200 hover:text-honey-300 transition-colors truncate">
              {hive.name}
            </Link>
          ) : (
            <span className="text-sm text-charcoal-400">a hive</span>
          )}
          {hive && (
            <StatusBadge status={hive.status} />
          )}
        </div>

        {garden && (
          <div className="text-xs text-charcoal-500 mb-2">
            📍{' '}
            <Link href={`/garden/${item.gardenId}`} className="hover:text-honey-400 transition-colors">
              {garden.name}
            </Link>
            {garden.location && ` · ${garden.location}`}
          </div>
        )}

        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-3 mt-2">
          <p className="text-sm text-charcoal-200 whitespace-pre-wrap leading-relaxed">
            {item.message}
          </p>
        </div>

        <p className="text-xs text-charcoal-600 mt-2">
          {format(ts, 'EEEE, MMMM d, yyyy · h:mm a')}
        </p>
      </div>
    </div>
  )
}

function DateGroup({ date, items, hiveMap, gardenMap }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-charcoal-800" />
        <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
          {date}
        </span>
        <div className="h-px flex-1 bg-charcoal-800" />
      </div>
      <div className="space-y-0">
        {items.map(item => (
          <ActivityItem key={item.id} item={item} hiveMap={hiveMap} gardenMap={gardenMap} />
        ))}
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [gardens,     setGardens]     = useState([])
  const [hives,       setHives]       = useState([])
  const [inspections, setInspections] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [filterGarden, setFilterGarden] = useState('all')

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  // Real-time all accessible gardens
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'gardens'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(g =>
          g.ownerId === user.uid ||
          (g.collaborators || []).some(c => c.uid === user.uid)
        )
      setGardens(all)
    })
  }, [user])

  // All hives across accessible gardens
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'hives'))
    return onSnapshot(q, snap =>
      setHives(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [user])

  // All inspections sorted by timestamp desc
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'inspections'),
      orderBy('timestamp', 'desc')
    )
    const unsubscribe = onSnapshot(q, snap => {
      setInspections(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setDataLoading(false)
    })
    return unsubscribe
  }, [user])

  // Lookup maps
  const gardenIds = new Set(gardens.map(g => g.id))
  const hiveMap   = Object.fromEntries(hives.map(h => [h.id, h]))
  const gardenMap = Object.fromEntries(gardens.map(g => [g.id, g]))

  // Filter to accessible inspections only
  const accessible = inspections.filter(i => gardenIds.has(i.gardenId))

  // Apply garden filter
  const filtered = filterGarden === 'all'
    ? accessible
    : accessible.filter(i => i.gardenId === filterGarden)

  // Group by date
  const groups = {}
  filtered.forEach(item => {
    const ts = item.timestamp instanceof Timestamp
      ? item.timestamp.toDate()
      : item.timestamp?.seconds
        ? new Date(item.timestamp.seconds * 1000)
        : new Date()
    const key = format(ts, 'EEEE, MMMM d, yyyy')
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-honey-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-charcoal-900 bg-honeycomb">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-50">Activity Feed</h1>
            <p className="text-charcoal-400 text-sm mt-1">
              All inspections across your apiaries, in real time
            </p>
          </div>

          {/* Garden filter */}
          {gardens.length > 1 && (
            <select
              value={filterGarden}
              onChange={e => setFilterGarden(e.target.value)}
              className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-3 py-2 text-sm text-charcoal-200 focus:outline-none focus:ring-2 focus:ring-honey-500"
            >
              <option value="all">All apiaries</option>
              {gardens.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats strip */}
        {!dataLoading && filtered.length > 0 && (
          <div className="flex gap-4 mb-8 p-4 bg-charcoal-800 border border-charcoal-700 rounded-xl">
            <div className="text-center">
              <p className="text-xl font-bold text-honey-400">{filtered.length}</p>
              <p className="text-xs text-charcoal-400">Entries</p>
            </div>
            <div className="w-px bg-charcoal-700" />
            <div className="text-center">
              <p className="text-xl font-bold text-honey-400">{new Set(filtered.map(i => i.hiveId)).size}</p>
              <p className="text-xs text-charcoal-400">Hives</p>
            </div>
            <div className="w-px bg-charcoal-700" />
            <div className="text-center">
              <p className="text-xl font-bold text-honey-400">{Object.keys(groups).length}</p>
              <p className="text-xs text-charcoal-400">Days</p>
            </div>
            <div className="w-px bg-charcoal-700" />
            <div className="text-center">
              <p className="text-xl font-bold text-honey-400">{new Set(filtered.map(i => i.authorId)).size}</p>
              <p className="text-xs text-charcoal-400">Beekeepers</p>
            </div>
          </div>
        )}

        {/* Feed */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-honey-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="text-5xl">🌸</div>
            <h2 className="text-xl font-semibold text-charcoal-300">No activity yet</h2>
            <p className="text-charcoal-500 max-w-xs mx-auto text-sm">
              Add some hives and log your first inspection to see activity here.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-5 py-2.5 bg-honey-500 hover:bg-honey-400 text-charcoal-900 rounded-xl text-sm font-semibold transition-colors"
            >
              Go to My Apiaries
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groups).map(([date, items]) => (
              <DateGroup
                key={date}
                date={date}
                items={items}
                hiveMap={hiveMap}
                gardenMap={gardenMap}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
