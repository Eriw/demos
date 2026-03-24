'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'
import StatusBadge, { STATUS_META } from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import { getSupabase } from '@/lib/supabase'
import { fetchHive, fetchGarden, fetchInspections, addInspection, deleteInspection, updateHive } from '@/lib/db'
import { format, isSameDay, parseISO } from 'date-fns'

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, { label }]) => ({ value, label }))

function InspectionEntry({ entry, canDelete, currentUserId, onDelete }) {
  const ts = new Date(entry.timestamp)
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-honey-500 mt-1 shrink-0 ring-2 ring-honey-500/20" />
        <div className="w-px bg-charcoal-700 flex-1 mt-1" />
      </div>
      <div className="flex-1 pb-5">
        <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-honey-400">{entry.author_name}</span>
              <span className="text-xs text-charcoal-500">{format(ts, 'MMM d, yyyy · h:mm a')}</span>
            </div>
            {canDelete && entry.author_id === currentUserId && (
              <button onClick={() => onDelete(entry)} className="opacity-0 group-hover:opacity-100 text-xs text-charcoal-600 hover:text-red-400 transition-all">×</button>
            )}
          </div>
          <p className="text-sm text-charcoal-200 whitespace-pre-wrap leading-relaxed">{entry.message}</p>
        </div>
      </div>
    </div>
  )
}

export default function HivePage({ params }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()

  const [hive,          setHive]          = useState(null)
  const [garden,        setGarden]        = useState(null)
  const [inspections,   setInspections]   = useState([])
  const [notFound,      setNotFound]      = useState(false)
  const [message,       setMessage]       = useState('')
  const [customDate,    setCustomDate]    = useState('')
  const [filterDate,    setFilterDate]    = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [msgError,      setMsgError]      = useState('')
  const [showEditStatus,setShowEditStatus]= useState(false)
  const [newStatus,     setNewStatus]     = useState('healthy')
  const [deleteTarget,  setDeleteTarget]  = useState(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  const loadHive = useCallback(async () => {
    try {
      const h = await fetchHive(id)
      setHive(h)
      setNewStatus(h.status)
    } catch { setNotFound(true) }
  }, [id])

  const loadGarden = useCallback(async (gardenId) => {
    if (!gardenId) return
    try { setGarden(await fetchGarden(gardenId)) } catch {}
  }, [])

  const loadInspections = useCallback(async () => {
    try { setInspections(await fetchInspections(id)) } catch (e) { console.error(e) }
  }, [id])

  useEffect(() => { loadHive() }, [loadHive])
  useEffect(() => { if (hive?.garden_id) loadGarden(hive.garden_id) }, [hive?.garden_id, loadGarden])
  useEffect(() => { loadInspections() }, [loadInspections])

  // Realtime
  useEffect(() => {
    if (!user) return
    const sb = getSupabase()
    const channel = sb.channel(`hive-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hives',       filter: `id=eq.${id}` }, loadHive)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections', filter: `hive_id=eq.${id}` }, loadInspections)
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [user, id, loadHive, loadInspections])

  const isOwner  = garden && user && garden.owner_id === user.id
  const isCollab = garden && user && (garden.garden_collaborators || []).some(c => c.user_id === user.id)
  const canAccess = isOwner || isCollab

  async function handleSubmit(e) {
    e.preventDefault()
    setMsgError('')
    setSubmitting(true)
    try {
      await addInspection({
        hiveId:     id,
        gardenId:   hive.garden_id,
        authorId:   user.id,
        authorName: user.user_metadata?.display_name || user.email,
        message,
        timestamp:  customDate ? new Date(customDate) : new Date(),
      })
      setMessage('')
      setCustomDate('')
    } catch (err) {
      setMsgError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(e) {
    e.preventDefault()
    await updateHive(id, { status: newStatus })
    setShowEditStatus(false)
  }

  const filtered = filterDate
    ? inspections.filter(i => isSameDay(new Date(i.timestamp), parseISO(filterDate)))
    : inspections

  const datesWithEntries = [...new Set(inspections.map(i => format(new Date(i.timestamp), 'yyyy-MM-dd')))]

  if (loading || !user) return <Spinner />
  if (notFound)         return <NotFound label="Hive not found" />
  if (!hive)            return <Spinner />
  if (garden && !canAccess) return <NotFound label="Access denied" icon="🔒" />

  return (
    <div className="min-h-screen bg-charcoal-900 bg-honeycomb">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-charcoal-400 mb-6 flex-wrap">
          <Link href="/dashboard" className="hover:text-honey-400 transition-colors">My Apiaries</Link>
          <span>/</span>
          {garden && (
            <><Link href={`/garden/${hive.garden_id}`} className="hover:text-honey-400 transition-colors">{garden.name}</Link><span>/</span></>
          )}
          <span className="text-charcoal-200">{hive.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-charcoal-50">{hive.name}</h1>
              <StatusBadge status={hive.status} />
            </div>
            <p className="text-charcoal-400 text-sm mt-1">{inspections.length} inspection{inspections.length !== 1 ? 's' : ''}</p>
          </div>
          {canAccess && (
            <button onClick={() => setShowEditStatus(true)} className="px-3 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 hover:border-honey-500/50 hover:text-honey-300 text-sm transition-colors">
              Update Status
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main log */}
          <div className="flex-1 min-w-0 space-y-6">
            {canAccess && (
              <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-charcoal-300 mb-3">New Inspection Log</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <textarea
                    value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} rows={3}
                    placeholder="Describe what you observed — queen spotted, brood pattern, honey stores, any concerns…"
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-3 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-honey-500 resize-none leading-relaxed"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-charcoal-500 mb-1">Date (leave blank for now)</label>
                      <input type="datetime-local" value={customDate} onChange={e => setCustomDate(e.target.value)}
                        className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-xs text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-honey-500" />
                    </div>
                    <button type="submit" disabled={submitting || !message.trim()}
                      className="px-5 py-2 bg-honey-500 hover:bg-honey-400 disabled:opacity-50 text-charcoal-900 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                      {submitting ? 'Logging…' : 'Log Entry'}
                    </button>
                  </div>
                  {msgError && <p className="text-xs text-red-400">{msgError}</p>}
                </form>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-4xl">📋</div>
                <p className="text-charcoal-400 text-sm">{filterDate ? 'No entries on this date.' : 'No inspections logged yet.'}</p>
              </div>
            ) : (
              <div>
                {filtered.map(entry => (
                  <InspectionEntry key={entry.id} entry={entry} canDelete={canAccess} currentUserId={user.id} onDelete={setDeleteTarget} />
                ))}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-charcoal-600 mt-1 shrink-0" />
                  </div>
                  <p className="text-xs text-charcoal-600 pb-2">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}{filterDate && ' on this date'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0 space-y-4">
            <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-charcoal-300 mb-3">Filter by Date</h3>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-honey-500" />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="mt-2 w-full text-xs text-charcoal-400 hover:text-honey-400 transition-colors">Clear filter</button>
              )}
              {datesWithEntries.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-charcoal-500 mb-2">Inspection dates</p>
                  <div className="flex flex-wrap gap-1.5">
                    {datesWithEntries.sort().reverse().slice(0, 20).map(dateStr => (
                      <button key={dateStr} onClick={() => setFilterDate(dateStr)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${filterDate === dateStr ? 'bg-honey-500 text-charcoal-900 font-medium' : 'bg-charcoal-700 text-charcoal-300 hover:bg-honey-500/20 hover:text-honey-300'}`}>
                        {format(parseISO(dateStr), 'MMM d')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-charcoal-300">Hive Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-400">Status</span>
                  <StatusBadge status={hive.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-400">Total logs</span>
                  <span className="text-charcoal-200">{inspections.length}</span>
                </div>
                {inspections.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal-400">Last check</span>
                    <span className="text-charcoal-200">{format(new Date(inspections[0].timestamp), 'MMM d')}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showEditStatus && (
        <Modal title="Update Hive Status" onClose={() => setShowEditStatus(false)}>
          <form onSubmit={handleStatusChange} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(({ value }) => (
                <label key={value} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${newStatus === value ? 'border-honey-500 bg-honey-500/10' : 'border-charcoal-600 hover:border-charcoal-500'}`}>
                  <input type="radio" name="status" value={value} checked={newStatus === value} onChange={() => setNewStatus(value)} className="sr-only" />
                  <StatusBadge status={value} />
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowEditStatus(false)} className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-2 rounded-lg bg-honey-500 hover:bg-honey-400 text-charcoal-900 text-sm font-semibold transition-colors">Update</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Entry?" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-charcoal-300 mb-6">This inspection log entry will be permanently deleted.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors">Cancel</button>
            <button onClick={async () => { await deleteInspection(deleteTarget.id); setDeleteTarget(null) }} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-honey-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function NotFound({ label, icon = '🚫' }) {
  return (
    <div className="min-h-screen bg-charcoal-900">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
        <div className="text-5xl">{icon}</div>
        <h2 className="text-xl font-semibold text-charcoal-200">{label}</h2>
        <Link href="/dashboard" className="text-honey-400 text-sm hover:underline">Back to Dashboard</Link>
      </div>
    </div>
  )
}
