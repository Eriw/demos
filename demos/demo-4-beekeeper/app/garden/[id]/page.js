'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, collection, query, where, onSnapshot, orderBy, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'
import StatusBadge, { STATUS_META } from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import CollaboratorModal from '@/components/CollaboratorModal'
import { createHive, deleteHive, updateHive, updateGarden } from '@/lib/db'

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, { label }]) => ({ value, label }))

function HiveCard({ hive, canEdit, onEdit, onDelete }) {
  return (
    <Link href={`/hive/${hive.id}`} className="block group">
      <div className="bg-charcoal-800 border border-charcoal-700 hover:border-honey-500/50 rounded-xl p-4 transition-all hover:shadow-md hover:shadow-honey-900/20">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-medium text-charcoal-100 truncate group-hover:text-honey-300 transition-colors">
            {hive.name}
          </h3>
          <StatusBadge status={hive.status} />
        </div>
        {canEdit && (
          <div className="flex gap-3 text-xs text-charcoal-500 border-t border-charcoal-700 pt-2 mt-1">
            <button
              onClick={e => { e.preventDefault(); onEdit(hive) }}
              className="hover:text-honey-400 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={e => { e.preventDefault(); onDelete(hive) }}
              className="hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function GardenPage({ params }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()

  const [garden,      setGarden]      = useState(null)
  const [hives,       setHives]       = useState([])
  const [notFound,    setNotFound]    = useState(false)
  const [showAddHive, setShowAddHive] = useState(false)
  const [showCollab,  setShowCollab]  = useState(false)
  const [editHive,    setEditHive]    = useState(null)
  const [deleteHiveTarget, setDeleteHiveTarget] = useState(null)
  const [newHiveName, setNewHiveName] = useState('')
  const [editName,    setEditName]    = useState('')
  const [editStatus,  setEditStatus]  = useState('healthy')
  const [formError,   setFormError]   = useState('')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  // Real-time garden listener
  useEffect(() => {
    if (!id) return
    return onSnapshot(doc(db, 'gardens', id), snap => {
      if (!snap.exists()) { setNotFound(true); return }
      setGarden({ id: snap.id, ...snap.data() })
    })
  }, [id])

  // Real-time hives listener
  useEffect(() => {
    if (!id) return
    const q = query(
      collection(db, 'hives'),
      where('gardenId', '==', id),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, snap =>
      setHives(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [id])

  // Access check
  const isOwner = garden && user && garden.ownerId === user.uid
  const isCollab = garden && user &&
    (garden.collaborators || []).some(c => c.uid === user.uid)
  const canAccess = isOwner || isCollab

  async function handleAddHive(e) {
    e.preventDefault()
    setFormError('')
    if (!newHiveName.trim()) { setFormError('Name is required.'); return }
    setSaving(true)
    try {
      await createHive({ name: newHiveName, gardenId: id, ownerId: user.uid })
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

  async function handleDeleteHive(hive) {
    await deleteHive(hive.id)
    setDeleteHiveTarget(null)
  }

  function openEditHive(hive) {
    setEditHive(hive)
    setEditName(hive.name)
    setEditStatus(hive.status)
    setFormError('')
  }

  // Status summary
  const statusCounts = hives.reduce((acc, h) => {
    acc[h.status] = (acc[h.status] || 0) + 1
    return acc
  }, {})

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-honey-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-charcoal-900">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
          <div className="text-5xl">🚫</div>
          <h2 className="text-xl font-semibold text-charcoal-200">Apiary not found</h2>
          <Link href="/dashboard" className="text-honey-400 text-sm hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  if (!garden) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-honey-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-charcoal-900">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-semibold text-charcoal-200">Access denied</h2>
          <Link href="/dashboard" className="text-honey-400 text-sm hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-charcoal-900 bg-honeycomb">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-charcoal-400 mb-6">
          <Link href="/dashboard" className="hover:text-honey-400 transition-colors">My Apiaries</Link>
          <span>/</span>
          <span className="text-charcoal-200">{garden.name}</span>
        </div>

        {/* Garden header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-50">{garden.name}</h1>
            {garden.location && (
              <p className="text-charcoal-400 text-sm mt-1">📍 {garden.location}</p>
            )}
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
                👥 Collaborators {garden.collaborators?.length ? `(${garden.collaborators.length})` : ''}
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

        {/* Hive grid */}
        {hives.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl">🏠</div>
            <h2 className="text-lg font-semibold text-charcoal-300">No hives yet</h2>
            <p className="text-charcoal-500 text-sm">Add your first hive to start tracking inspections.</p>
            <button
              onClick={() => setShowAddHive(true)}
              className="px-5 py-2.5 bg-honey-500 hover:bg-honey-400 text-charcoal-900 rounded-lg text-sm font-semibold transition-colors"
            >
              Add First Hive
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {hives.map(hive => (
              <HiveCard
                key={hive.id}
                hive={hive}
                canEdit={canAccess}
                onEdit={openEditHive}
                onDelete={setDeleteHiveTarget}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add hive modal */}
      {showAddHive && (
        <Modal title="Add Hive" onClose={() => setShowAddHive(false)}>
          <form onSubmit={handleAddHive} className="space-y-4">
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Hive Name *</label>
              <input
                autoFocus
                type="text"
                value={newHiveName}
                onChange={e => setNewHiveName(e.target.value)}
                maxLength={80}
                placeholder="e.g. Hive #1 – Langstroth"
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-honey-500"
              />
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddHive(false)} className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-honey-500 hover:bg-honey-400 disabled:opacity-50 text-charcoal-900 text-sm font-semibold transition-colors">
                {saving ? 'Adding…' : 'Add Hive'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit hive modal */}
      {editHive && (
        <Modal title="Edit Hive" onClose={() => setEditHive(null)}>
          <form onSubmit={handleEditHive} className="space-y-4">
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Name</label>
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                maxLength={80}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-honey-500"
              />
            </div>
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-honey-500"
              >
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditHive(null)} className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-honey-500 hover:bg-honey-400 disabled:opacity-50 text-charcoal-900 text-sm font-semibold transition-colors">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete hive confirm */}
      {deleteHiveTarget && (
        <Modal title="Delete Hive?" onClose={() => setDeleteHiveTarget(null)}>
          <p className="text-sm text-charcoal-300 mb-6">
            Delete <strong className="text-charcoal-100">{deleteHiveTarget.name}</strong>?
            All inspection logs for this hive will remain but will be orphaned.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteHiveTarget(null)} className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors">Cancel</button>
            <button onClick={() => handleDeleteHive(deleteHiveTarget)} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">Delete</button>
          </div>
        </Modal>
      )}

      {/* Collaborator modal */}
      {showCollab && (
        <CollaboratorModal
          garden={garden}
          currentUser={user}
          onClose={() => setShowCollab(false)}
        />
      )}
    </div>
  )
}
