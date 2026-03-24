'use client'

import { useState } from 'react'
import Modal from './Modal'
import { getProfileByEmail, addCollaborator, removeCollaborator } from '@/lib/db'

export default function CollaboratorModal({ garden, currentUser, onClose, onRefresh }) {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const collaborators = garden.garden_collaborators || []

  async function handleInvite(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return

    if (trimmed === currentUser.email) {
      setError('You cannot add yourself as a collaborator.')
      return
    }
    if (collaborators.some(c => c.email === trimmed)) {
      setError('This user is already a collaborator.')
      return
    }

    setLoading(true)
    try {
      const profile = await getProfileByEmail(trimmed)
      if (!profile) {
        setError('No user found with that email. They must sign up first.')
        return
      }
      await addCollaborator(garden.id, {
        userId:      profile.id,
        email:       profile.email,
        displayName: profile.display_name || profile.email,
      })
      setSuccess(`${profile.display_name || profile.email} added as collaborator.`)
      setEmail('')
      onRefresh?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(collab) {
    try {
      await removeCollaborator(garden.id, collab.user_id)
      onRefresh?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal title="Manage Collaborators" onClose={onClose}>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wider text-charcoal-400 mb-2">Current Collaborators</p>
        {collaborators.length === 0 ? (
          <p className="text-sm text-charcoal-400 italic">No collaborators yet.</p>
        ) : (
          <ul className="space-y-2">
            {collaborators.map(c => (
              <li key={c.user_id} className="flex items-center justify-between gap-3 bg-charcoal-700 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm text-charcoal-100">{c.display_name || c.email}</p>
                  <p className="text-xs text-charcoal-400">{c.email}</p>
                </div>
                <button
                  onClick={() => handleRemove(c)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleInvite} className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-charcoal-400">Invite by Email</p>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="collaborator@example.com"
          className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-sm text-charcoal-100 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-honey-500"
        />
        {error   && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-emerald-400">{success}</p>}
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-2 rounded-lg bg-honey-500 hover:bg-honey-400 disabled:opacity-50 text-charcoal-900 text-sm font-semibold transition-colors"
        >
          {loading ? 'Looking up…' : 'Add Collaborator'}
        </button>
      </form>
    </Modal>
  )
}
