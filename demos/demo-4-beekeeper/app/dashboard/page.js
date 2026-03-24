'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  collection, query, where, or, onSnapshot, orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import { createGarden, deleteGarden } from '@/lib/db'
import Link from 'next/link'

function GardenCard({ garden, onDelete }) {
  const hiveCount = garden._hiveCount || 0
  return (
    <Link href={`/garden/${garden.id}`} className="block group">
      <div className="bg-charcoal-800 border border-charcoal-700 hover:border-honey-500/50 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-honey-900/20">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-charcoal-100 truncate group-hover:text-honey-300 transition-colors">
              {garden.name}
            </h3>
            {garden.location && (
              <p className="text-xs text-charcoal-400 truncate mt-0.5">📍 {garden.location}</p>
            )}
          </div>
          <span className="shrink-0 px-2 py-0.5 bg-charcoal-700 rounded text-xs text-charcoal-300">
            {hiveCount} {hiveCount === 1 ? 'hive' : 'hives'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-charcoal-500 mt-3 pt-3 border-t border-charcoal-700">
          <span>
            {(garden.collaborators || []).length > 0
              ? `${garden.collaborators.length} collaborator${garden.collaborators.length > 1 ? 's' : ''}`
              : 'No collaborators'}
          </span>
          <button
            onClick={e => { e.preventDefault(); onDelete(garden) }}
            className="text-charcoal-600 hover:text-red-400 transition-colors px-1"
          >
            Delete
          </button>
        </div>
      </div>
    </Link>
  )
}

function CollaboratingCard({ garden }) {
  const hiveCount = garden._hiveCount || 0
  return (
    <Link href={`/garden/${garden.id}`} className="block group">
      <div className="bg-charcoal-800 border border-charcoal-700 hover:border-honey-500/50 rounded-2xl p-5 transition-all">
        <div className="flex items-start gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-charcoal-100 truncate group-hover:text-honey-300 transition-colors">
              {garden.name}
            </h3>
            {garden.location && (
              <p className="text-xs text-charcoal-400 truncate mt-0.5">📍 {garden.location}</p>
            )}
          </div>
          <span className="shrink-0 text-xs bg-honey-900/30 text-honey-400 px-2 py-0.5 rounded border border-honey-800/40">
            Collaborator
          </span>
        </div>
        <p className="text-xs text-charcoal-500 mt-3">
          Owned by {garden.ownerEmail} · {hiveCount} {hiveCount === 1 ? 'hive' : 'hives'}
        </p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [myGardens,    setMyGardens]    = useState([])
  const [collabGardens, setCollabGardens] = useState([])
  const [hiveCounts,   setHiveCounts]   = useState({})
  const [showCreate,   setShowCreate]   = useState(false)
  const [newName,      setNewName]      = useState('')
  const [newLocation,  setNewLocation]  = useState('')
  const [creating,     setCreating]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formError,    setFormError]    = useState('')

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [user, loading, router])

  // Real-time: my gardens
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'gardens'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap =>
      setMyGardens(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [user])

  // Real-time: collaborating gardens
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'gardens'),
      where('collaborators', 'array-contains', {
        uid:         user.uid,
        email:       user.email,
        displayName: user.displayName,
      })
    )
    // Firestore array-contains on objects requires exact match; use a workaround:
    // listen to all gardens and filter client-side for collaborator uid
    const allQ = query(collection(db, 'gardens'), orderBy('createdAt', 'desc'))
    return onSnapshot(allQ, snap => {
      const collab = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(g => g.ownerId !== user.uid &&
          (g.collaborators || []).some(c => c.uid === user.uid))
      setCollabGardens(collab)
    })
  }, [user])

  // Real-time: hive counts per garden
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'hives'))
    return onSnapshot(q, snap => {
      const counts = {}
      snap.docs.forEach(d => {
        const gid = d.data().gardenId
        counts[gid] = (counts[gid] || 0) + 1
      })
      setHiveCounts(counts)
    })
  }, [user])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!newName.trim()) { setFormError('Name is required.'); return }
    setCreating(true)
    try {
      await createGarden({ name: newName, location: newLocation, ownerId: user.uid, ownerEmail: user.email })
      setShowCreate(false)
      setNewName('')
      setNewLocation('')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(garden) {
    await deleteGarden(garden.id)
    setDeleteTarget(null)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-honey-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const allGardens = [...myGardens, ...collabGardens]
  const totalHives = Object.values(hiveCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-charcoal-900 bg-honeycomb">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-50">My Apiaries</h1>
            <p className="text-charcoal-400 text-sm mt-1">
              {myGardens.length} location{myGardens.length !== 1 ? 's' : ''} · {totalHives} total hives
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-honey-500 hover:bg-honey-400 text-charcoal-900 rounded-xl text-sm font-semibold transition-colors shadow"
          >
            <span className="text-lg leading-none">+</span> New Apiary
          </button>
        </div>

        {/* Stats bar */}
        {allGardens.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Locations', value: myGardens.length + collabGardens.length },
              { label: 'Hives',     value: totalHives },
              { label: 'Collab',    value: collabGardens.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-honey-400">{value}</p>
                <p className="text-xs text-charcoal-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* My gardens */}
        {myGardens.length === 0 && collabGardens.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="text-6xl">🍯</div>
            <h2 className="text-xl font-semibold text-charcoal-300">No apiaries yet</h2>
            <p className="text-charcoal-500 max-w-xs mx-auto">
              Create your first apiary location to start tracking hives and inspections.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-honey-500 hover:bg-honey-400 text-charcoal-900 rounded-xl text-sm font-semibold transition-colors"
            >
              Create First Apiary
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {myGardens.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-3">
                  Owned by me
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myGardens.map(g => (
                    <GardenCard
                      key={g.id}
                      garden={{ ...g, _hiveCount: hiveCounts[g.id] || 0 }}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              </section>
            )}

            {collabGardens.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-3">
                  Collaborating on
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collabGardens.map(g => (
                    <CollaboratingCard
                      key={g.id}
                      garden={{ ...g, _hiveCount: hiveCounts[g.id] || 0 }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Create garden modal */}
      {showCreate && (
        <Modal title="New Apiary Location" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Name *</label>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={80}
                placeholder="e.g. North Meadow Apiary"
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-honey-500"
              />
            </div>
            <div>
              <label className="block text-xs text-charcoal-400 mb-1">Location (optional)</label>
              <input
                type="text"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                maxLength={120}
                placeholder="e.g. 123 Farm Road, Riverside"
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-honey-500"
              />
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-2 rounded-lg bg-honey-500 hover:bg-honey-400 disabled:opacity-50 text-charcoal-900 text-sm font-semibold transition-colors"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <Modal title="Delete Apiary?" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-charcoal-300 mb-6">
            Are you sure you want to delete <strong className="text-charcoal-100">{deleteTarget.name}</strong>?
            This will not automatically delete hives — you should remove them first.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2 rounded-lg border border-charcoal-600 text-charcoal-300 text-sm hover:bg-charcoal-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteTarget)}
              className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
