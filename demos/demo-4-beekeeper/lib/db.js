import { getSupabase } from './supabase'

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function getProfileByEmail(email) {
  const sb = getSupabase()
  const { data } = await sb
    .from('profiles')
    .select('id, email, display_name')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()
  return data
}

// ── Gardens ───────────────────────────────────────────────────────────────────

export async function fetchGardens() {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('gardens')
    .select('*, garden_collaborators(user_id, email, display_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchGarden(id) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('gardens')
    .select('*, garden_collaborators(user_id, email, display_name)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createGarden({ name, location, ownerId, ownerEmail }) {
  if (!name?.trim()) throw new Error('Name is required.')
  if (name.length > 80) throw new Error('Name must be 80 characters or fewer.')
  const sb = getSupabase()
  const { data, error } = await sb
    .from('gardens')
    .insert({ name: name.trim(), location: (location || '').trim(), owner_id: ownerId, owner_email: ownerEmail })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateGarden(id, { name, location }) {
  const sb = getSupabase()
  const patch = {}
  if (name !== undefined)     patch.name     = name.trim().slice(0, 80)
  if (location !== undefined) patch.location = location.trim().slice(0, 120)
  patch.updated_at = new Date().toISOString()
  const { error } = await sb.from('gardens').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteGarden(id) {
  const sb = getSupabase()
  const { error } = await sb.from('gardens').delete().eq('id', id)
  if (error) throw error
}

// ── Collaborators ─────────────────────────────────────────────────────────────

export async function addCollaborator(gardenId, { userId, email, displayName }) {
  const sb = getSupabase()
  const { error } = await sb
    .from('garden_collaborators')
    .insert({ garden_id: gardenId, user_id: userId, email, display_name: displayName || '' })
  if (error) throw error
}

export async function removeCollaborator(gardenId, userId) {
  const sb = getSupabase()
  const { error } = await sb
    .from('garden_collaborators')
    .delete()
    .eq('garden_id', gardenId)
    .eq('user_id', userId)
  if (error) throw error
}

// ── Hives ─────────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['healthy', 'needs_attention', 'swarming', 'dormant']

export async function fetchHives(gardenId) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('hives')
    .select('*')
    .eq('garden_id', gardenId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchHive(id) {
  const sb = getSupabase()
  const { data, error } = await sb.from('hives').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createHive({ name, gardenId, ownerId }) {
  if (!name?.trim()) throw new Error('Name is required.')
  if (name.length > 80) throw new Error('Name must be 80 characters or fewer.')
  const sb = getSupabase()
  const { data, error } = await sb
    .from('hives')
    .insert({ name: name.trim(), garden_id: gardenId, owner_id: ownerId, status: 'healthy' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateHive(id, data) {
  const patch = {}
  if (data.name)   patch.name   = data.name.trim().slice(0, 80)
  if (data.status) {
    if (!VALID_STATUSES.includes(data.status)) throw new Error('Invalid status.')
    patch.status = data.status
  }
  patch.updated_at = new Date().toISOString()
  const sb = getSupabase()
  const { error } = await sb.from('hives').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteHive(id) {
  const sb = getSupabase()
  const { error } = await sb.from('hives').delete().eq('id', id)
  if (error) throw error
}

// ── Inspections ───────────────────────────────────────────────────────────────

export async function fetchInspections(hiveId) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('inspections')
    .select('*')
    .eq('hive_id', hiveId)
    .order('timestamp', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchAllInspections(gardenIds) {
  if (!gardenIds.length) return []
  const sb = getSupabase()
  const { data, error } = await sb
    .from('inspections')
    .select('*')
    .in('garden_id', gardenIds)
    .order('timestamp', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addInspection({ hiveId, gardenId, authorId, authorName, message, timestamp }) {
  if (!message?.trim()) throw new Error('Message cannot be empty.')
  if (message.length > 2000) throw new Error('Message too long (max 2000 chars).')
  const sb = getSupabase()
  const { error } = await sb.from('inspections').insert({
    hive_id:     hiveId,
    garden_id:   gardenId,
    author_id:   authorId,
    author_name: authorName,
    message:     message.trim(),
    timestamp:   timestamp instanceof Date ? timestamp.toISOString() : new Date().toISOString(),
  })
  if (error) throw error
}

export async function deleteInspection(id) {
  const sb = getSupabase()
  const { error } = await sb.from('inspections').delete().eq('id', id)
  if (error) throw error
}
