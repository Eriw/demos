'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { getSupabase } from '@/lib/supabase'
import { fetchGardens, fetchAllInspections } from '@/lib/db'
import { format } from 'date-fns'

function ActivityItem({ item, hiveMap, gardenMap }) {
  const ts     = new Date(item.timestamp)
  const hive   = hiveMap[item.hive_id]
  const garden = gardenMap[item.garden_id]

  return (
    <div className="flex gap-4 group">
      <div className="shrink-0 w-9 h-9 rounded-full bg-honey-700/30 border border-honey-600/30 flex items-center justify-center text-sm font-bold text-honey-400 mt-0.5">
        {(item.author_name || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 pb-5 border-b border-charcoal-800">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
          <span className="text-sm font-semibold text-honey-400">{item.author_name}</span>
          <span className="text-xs text-charcoal-500">logged an inspection on</span>
          {hive ? (
            <Link href={`/hive/${item.hive_id}`} className="text-sm font-medium text-charcoal-200 hover:text-honey-300 transition-colors">
              {hive.name}
            </Link>
          ) : (
            <span className="text-sm text-charcoal-400">a hive</span>
          )}
          {hive && <StatusBadge status={hive.status} />}
        </div>
        {garden && (
          <p className="text-xs text-charcoal-500 mb-2">
            📍 <Link href={`/garden/${item.garden_id}`} className="hover:text-honey-400 transition-colors">{garden.name}</Link>
            {garden.location && ` · ${garden.location}`}
          </p>
        )}
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-3 mt-2">
          <p className="text-sm text-charcoal-200 whitespace-pre-wrap leading-relaxed">{item.message}</p>
        </div>
        <p className="text-xs text-charcoal-600 mt-2">{format(ts, 'EEEE, MMMM d, yyyy · h:mm a')}</p>
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [gardens,      setGardens]      = useState([])
  const [hives,        setHives]        = useState([])
  const [inspections,  setInspections]  = useState([])
  const [dataLoading,  setDataLoading]  = useState(true)
  const [filterGarden, setFilterGarden] = useState('all')

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  const loadAll = useCallback(async () => {
    if (!user) return
    const sb = getSupabase()
    const [gs, { data: hivesData }] = await Promise.all([
      fetchGardens(),
      sb.from('hives').select('*'),
    ])
    setGardens(gs)
    setHives(hivesData || [])
    const gardenIds = gs.map(g => g.id)
    setInspections(await fetchAllInspections(gardenIds))
    setDataLoading(false)
  }, [user])

  useEffect(() => { loadAll() }, [loadAll])

  // Realtime: re-fetch on any inspection or hive change
  useEffect(() => {
    if (!user) return
    const sb = getSupabase()
    const channel = sb.channel('activity-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hives' }, loadAll)
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [user, loadAll])

  const gardenIds  = new Set(gardens.map(g => g.id))
  const hiveMap    = Object.fromEntries(hives.map(h => [h.id, h]))
  const gardenMap  = Object.fromEntries(gardens.map(g => [g.id, g]))

  const filtered = filterGarden === 'all'
    ? inspections.filter(i => gardenIds.has(i.garden_id))
    : inspections.filter(i => i.garden_id === filterGarden)

  // Group by date label
  const groups = {}
  filtered.forEach(item => {
    const key = format(new Date(item.timestamp), 'EEEE, MMMM d, yyyy')
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-50">Activity Feed</h1>
            <p className="text-charcoal-400 text-sm mt-1">All inspections across your apiaries, in real time</p>
          </div>
          {gardens.length > 1 && (
            <select value={filterGarden} onChange={e => setFilterGarden(e.target.value)}
              className="bg-charcoal-800 border border-charcoal-700 rounded-lg px-3 py-2 text-sm text-charcoal-200 focus:outline-none focus:ring-2 focus:ring-honey-500">
              <option value="all">All apiaries</option>
              {gardens.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
        </div>

        {!dataLoading && filtered.length > 0 && (
          <div className="flex gap-4 mb-8 p-4 bg-charcoal-800 border border-charcoal-700 rounded-xl">
            {[
              { label: 'Entries',    value: filtered.length },
              { label: 'Hives',      value: new Set(filtered.map(i => i.hive_id)).size },
              { label: 'Days',       value: Object.keys(groups).length },
              { label: 'Beekeepers', value: new Set(filtered.map(i => i.author_id)).size },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-honey-400">{value}</p>
                  <p className="text-xs text-charcoal-400">{label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-charcoal-700" />}
              </div>
            ))}
          </div>
        )}

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
            <Link href="/dashboard" className="inline-block px-5 py-2.5 bg-honey-500 hover:bg-honey-400 text-charcoal-900 rounded-xl text-sm font-semibold transition-colors">
              Go to My Apiaries
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groups).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-charcoal-800" />
                  <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">{date}</span>
                  <div className="h-px flex-1 bg-charcoal-800" />
                </div>
                <div className="space-y-0">
                  {items.map(item => <ActivityItem key={item.id} item={item} hiveMap={hiveMap} gardenMap={gardenMap} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
