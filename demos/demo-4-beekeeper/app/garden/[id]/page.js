'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'
import StatusBadge, { STATUS_META } from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import CollaboratorModal from '@/components/CollaboratorModal'
import { getSupabase } from '@/lib/supabase'
import { fetchGarden, fetchHives, createHive, updateHive, deleteHive } from '@/lib/db'

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, { label }]) => ({ value, label }))

export default function GardenPage({ params }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()

  const [garden,       setGarden]       = useState(null)
  const [hives,        setHives]        = useState([])
  const [notFound,     setNotFound]     = useState(false)
  const [showAddHive,  setShowAddHive]  = useState(false)
  const [showCollab,   setShowCollab]   = useState(false)
  const [editHive,     setEditHive]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [newHiveName,  setNewHiveName]  = useState('')
  const [editName,     setEditName]     = useState('')
  const [editStatus,   setEditStatus]   = useState('healthy')
  const [formError,    setFormError]    = useState('')
  const [saving,       setSaving]       = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  const loadGarden = useCallback(async () => {
    try {
      setGarden(await fetchGarden(id))
    } catch {
      setNotFound(true)
    }
  }, [id])

  const loadHives = useCallback(async () => {
    try {
      setHives(await fetchHives(id))
    } catch (e) { console.error(e) }
  }, [id])

  useEffect(() => {
    loadGarden()
    loadHives()
  }, [loadGarden, loadHives])

  // Realtime
  useEffect(() => {
    if (!user) return
    const sb = getSupabase()
    const channel = sb.channel(`garden-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gardens',             filter: `id=eq.${id}` }, loadGarden)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garden_collaborators',filter: `garden_id=eq.${id}` }, loadGarden)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hives',               filter: `garden_id=eq.${id}` }, loadHives)
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [user, id, loadGarden, loadHives])

  const isOwner  = garden && user && garden.owner_id === user.id
  const isCollab = garden && user && (garden.garden_collaborators || []).some(c => c.user_id === user.id)
  const canAccess = isOwner || isCollab

  async function handleAddHive(e) {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await createHive({ name: newHiveName, gardenId: id, ownerId: user.id })
      setShowAddHive(false)
      setNewHiveName('')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleEditHive(e) {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await updateHive(editHive.id, { name: editName, status: editStatus })
      setEditHive(null)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function openEditHive(hive) {
    setEditHive(hive)
    setEditName(hive.name)
    setEditStatus(hive.status)
    setFormError('')
  }

  const statusCounts = hives.reduce((acc, h) => {
    acc[h.status] = (acc[h.status] || 0) + 1
    return acc
  }, {})

  if (loading || !user) return <Spinner />
  if (notFound)         return <NotFound label="Apiary not found" />
  if (!garden)          return <Spinner />
  if (!canAccess)       return <NotFound label="Access denied" icon="🔒" />

  return (
    <div className="min-h-screen bg-charcoal-900 bg-honeycomb">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-charcoal-400 mb-6">
          <Link href="/dashboard" className="hover:text-honey-400 transition-colors">My Apiaries</Link>
          <span>/</span>
          <span className="text-charcoal-200">{garden.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-50">{garden.name}</h1>
            {garden.location && <p className="text-charcoal-400 text-sm mt-1">📍 {garden.location}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <span key={status} className="flex items-center gap-1">
                  <StatusBadge status={status} />
                  <span className="text-xs text-charcoal-400">×{count}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <button
                onClick={() => setShowCollab(true)}
                className="px-3 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 hover:border-honey-500/50 hover:text-honey-300 text-sm transition-colors"
              >
                👥 Collaborators {(garden.garden_collaborators?.length || 0) > 0 ? `(${garden.garden_collaborators.length})` : ''}
              </button>
            )}
            <button
              onClick={() => { setShowAddHive(true); setFormError('') }}
              className="px-4 py-2 bg-honey-500 hover:bg-honey-400 text-charcoal-900 rounded-lg text-sm font-semibold transition-colors"
            >
              + Add Hive
            </button>
          </div>
        </div>

        {hives.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl">🏠</div>
            <h2 className="text-lg font-semibold text-charcoal-300">No hives yet</h2>
            <p className="text-charcoal-500 text-sm">Add your first hive to start tracking inspections.</p>
            <button onClick={() => setShowAddHive(true)} className="px-5 py-2.5 bg-honey-500 hover:bg-honey-400 text-charcoal-900 rounded-lg text-sm font-semibold transition-colors">
              Add First Hive
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {hives.map(hive => (
              <Link key={hive.id} href={`/hive/${hive.id}`} className="block group">
                <div className="bg-charcoal-800 border border-charcoal-700 hover:border-honey-500/50 rounded-xl p-4 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-medium text-charcoal-100 truncate group-hover:text-honey-300 transition-colors">{hive.name}</h3>
                    <StatusBadge status={hive.status} />
                  </div>
                  {canAccess && (
                    <div className="flex gap-3 text-xs text-charcoal-500 border-t border-charcoal-700 pt-2">
                      <button onClick={e => { e.preventDefault(); openEditHive(hive) }} className="hover:text-honey-400 transition-colors">Edit</button>
                      <button onClick={e => { e.preventDefault(); setDeleteTarget(hive) }} className="hover:text-red-400 transition-colors">Delete</button>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showAddHive && (
        <Modal title="Add Hive" onClose={() => setShowAddHive(false)}>
          <form onSubmit={handleAddHive} className="space-y-4">
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Hive Name *</label>
              <input autoFocus type="text" value={newHiveName} onChange={e => setNewHiveName(e.target.value)} maxLength={80}
                placeholder="e.g. Hive #1 – Langstroth"
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-honey-500" />
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddHive(false)} className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-honey-500 hover:bg-honey-400 disabled:opacity-50 text-charcoal-900 text-sm font-semibold transition-colors">{saving ? 'Adding…' : 'Add Hive'}</button>
            </div>
          </form>
        </Modal>
      )}

      {editHive && (
        <Modal title="Edit Hive" onClose={() => setEditHive(null)}>
          <form onSubmit={handleEditHive} className="space-y-4">
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Name</label>
              <input autoFocus type="text" value={editName} onChange={e => setEditName(e.target.value)} maxLength={80}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-honey-500" />
            </div>
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Status</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-honey-500">
                {STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditHive(null)} className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-honey-500 hover:bg-honey-400 disabled:opacity-50 text-charcoal-900 text-sm font-semibold transition-colors">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Hive?" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-charcoal-300 mb-6">Delete <strong className="text-charcoal-100">{deleteTarget.name}</strong>? Inspection logs will also be deleted.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors">Cancel</button>
            <button onClick={async () => { await deleteHive(deleteTarget.id); setDeleteTarget(null) }} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">Delete</button>
          </div>
        </Modal>
      )}

      {showCollab && (
        <CollaboratorModal garden={garden} currentUser={user} onClose={() => setShowCollab(false)} onRefresh={loadGarden} />
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
