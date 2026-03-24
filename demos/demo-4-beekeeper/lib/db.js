import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUserByEmail(email) {
  const q = query(collection(db, 'users'), where('email', '==', email))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// ── Gardens ───────────────────────────────────────────────────────────────────

export async function createGarden({ name, location, ownerId, ownerEmail }) {
  if (!name || name.length > 80) throw new Error('Garden name must be 1–80 characters.')
  return addDoc(collection(db, 'gardens'), {
    name:          name.trim(),
    location:      (location || '').trim().slice(0, 120),
    ownerId,
    ownerEmail,
    collaborators: [],
    createdAt:     serverTimestamp(),
    updatedAt:     serverTimestamp(),
  })
}

export async function updateGarden(gardenId, data) {
  const allowed = ['name', 'location']
  const safe = {}
  for (const k of allowed) if (data[k] !== undefined) safe[k] = data[k]
  safe.updatedAt = serverTimestamp()
  return updateDoc(doc(db, 'gardens', gardenId), safe)
}

export async function deleteGarden(gardenId) {
  return deleteDoc(doc(db, 'gardens', gardenId))
}

export async function addCollaborator(gardenId, { uid, email, displayName }) {
  return updateDoc(doc(db, 'gardens', gardenId), {
    collaborators: arrayUnion({ uid, email, displayName }),
    updatedAt:     serverTimestamp(),
  })
}

export async function removeCollaborator(gardenId, { uid }) {
  const snap = await getDoc(doc(db, 'gardens', gardenId))
  if (!snap.exists()) return
  const collaborators = (snap.data().collaborators || []).filter(c => c.uid !== uid)
  return updateDoc(doc(db, 'gardens', gardenId), { collaborators, updatedAt: serverTimestamp() })
}

// ── Hives ─────────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['healthy', 'needs_attention', 'swarming', 'dormant']

export async function createHive({ name, gardenId, ownerId }) {
  if (!name || name.length > 80) throw new Error('Hive name must be 1–80 characters.')
  return addDoc(collection(db, 'hives'), {
    name:      name.trim(),
    gardenId,
    ownerId,
    status:    'healthy',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateHive(hiveId, data) {
  const safe = {}
  if (data.name)   safe.name   = data.name.trim().slice(0, 80)
  if (data.status) {
    if (!VALID_STATUSES.includes(data.status)) throw new Error('Invalid status.')
    safe.status = data.status
  }
  safe.updatedAt = serverTimestamp()
  return updateDoc(doc(db, 'hives', hiveId), safe)
}

export async function deleteHive(hiveId) {
  return deleteDoc(doc(db, 'hives', hiveId))
}

// ── Inspections ───────────────────────────────────────────────────────────────

export async function addInspection({ hiveId, gardenId, authorId, authorName, message, timestamp }) {
  if (!message || message.trim().length === 0) throw new Error('Message cannot be empty.')
  if (message.length > 2000) throw new Error('Message too long (max 2000 chars).')
  const ts = timestamp instanceof Date ? Timestamp.fromDate(timestamp) : serverTimestamp()
  return addDoc(collection(db, 'inspections'), {
    hiveId,
    gardenId,
    authorId,
    authorName: authorName || 'Unknown',
    message:    message.trim(),
    timestamp:  ts,
    createdAt:  serverTimestamp(),
  })
}

export async function deleteInspection(inspectionId) {
  return deleteDoc(doc(db, 'inspections', inspectionId))
}
