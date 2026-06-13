const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

function sbHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    ...extra,
  }
}

async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: sbHeaders() })
  const data = await r.json()
  return { data, ok: r.ok }
}

async function sbInsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders({ 'Prefer': 'return=representation' }),
    body: JSON.stringify(body),
  })
  const data = await r.json()
  return { data: Array.isArray(data) ? data[0] : data, ok: r.ok }
}

async function sbPatch(table, filter, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: sbHeaders({ 'Prefer': 'return=representation' }),
    body: JSON.stringify(body),
  })
  return { ok: r.ok }
}

async function sbDelete(table, filter) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: sbHeaders(),
  })
  return { ok: r.ok }
}

// Verifica token admin: retorna el objeto polla si el token es válido, null si no
async function verificarToken(polla_id, token) {
  if (!polla_id || !token) return null
  const { data, ok } = await sbGet(`/pollas?id=eq.${polla_id}&select=id,token_admin&limit=1`)
  if (!ok || !Array.isArray(data) || data.length === 0) return null
  const polla = data[0]
  return polla.token_admin === token ? polla : null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // ── GET ───────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { id, action, ids } = req.query

      // GET ?action=mis-pollas&ids=id1,id2,... — pollas por array de IDs (tokens en localStorage)
      if (action === 'mis-pollas') {
        if (!ids) return res.status(200).json({ pollas: [] })

        // Sanitizar IDs: solo UUID chars (hex + guiones) o dígitos
        const safeIds = ids.split(',')
          .map(s => s.trim())
          .filter(s => /^[0-9a-f-]+$/i.test(s) && s.length > 0)
          .join(',')

        if (!safeIds) return res.status(200).json({ pollas: [] })

        const { data: pollas, ok } = await sbGet(
          `/pollas?id=in.(${safeIds})&order=created_at.desc`
        )
        if (!ok || !Array.isArray(pollas) || pollas.length === 0)
          return res.status(200).json({ pollas: [] })

        // Conteo de participantes en batch
        const { data: votos } = await sbGet(`/votos?polla_id=in.(${safeIds})&select=polla_id`)
        const countMap = {}
        for (const v of votos || []) countMap[v.polla_id] = (countMap[v.polla_id] || 0) + 1

        return res.status(200).json({
          pollas: pollas.map(p => ({ ...p, participantes: countMap[p.id] || 0 })),
        })
      }

      // GET ?id=xxx — polla + votos (sin exponer token_admin al cliente)
      if (!id) return res.status(400).json({ error: 'id requerido' })
      const { data: pollas, ok: pOk } = await sbGet(`/pollas?id=eq.${id}&limit=1`)
      if (!pOk || !Array.isArray(pollas) || pollas.length === 0)
        return res.status(404).json({ error: 'Polla no encontrada' })
      const { data: votos } = await sbGet(`/votos?polla_id=eq.${id}&order=created_at.asc`)

      // Nunca exponer token_admin al cliente
      const { token_admin: _omit, ...pollaPublica } = pollas[0]
      return res.status(200).json({ polla: pollaPublica, votos: votos || [] })
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body || {}
      const { action } = body

      // ── crear polla ───────────────────────────────────────────────────────
      if (action === 'crear') {
        const { partido_id, equipo_local, equipo_visitante, fecha_partido,
                creador_nombre, permite_repetir, max_repeticiones } = body
        if (!partido_id || !equipo_local || !equipo_visitante || !fecha_partido || !creador_nombre)
          return res.status(400).json({ error: 'Faltan campos requeridos' })

        const token = crypto.randomUUID()
        const { data, ok } = await sbInsert('pollas', {
          partido_id:       Number(partido_id),
          equipo_local,
          equipo_visitante,
          fecha_partido,
          creador_nombre,
          permite_repetir:  !!permite_repetir,
          max_repeticiones: max_repeticiones ? Number(max_repeticiones) : null,
          activa:           true,
          token_admin:      token,
        })
        if (!ok) return res.status(400).json({ error: data?.message || 'Error al crear la polla' })
        return res.status(200).json({ id: data.id, token_admin: data.token_admin || token })
      }

      // ── votar ─────────────────────────────────────────────────────────────
      if (action === 'votar') {
        const { polla_id, participante_nombre, goles_local, goles_visitante } = body
        if (!polla_id || !participante_nombre || goles_local == null || goles_visitante == null)
          return res.status(400).json({ error: 'Faltan campos requeridos' })

        const { data: pollas } = await sbGet(`/pollas?id=eq.${polla_id}&limit=1`)
        const polla = Array.isArray(pollas) ? pollas[0] : null
        if (!polla) return res.status(404).json({ error: 'Polla no encontrada' })
        if (!polla.activa) return res.status(400).json({ error: 'Esta polla está cerrada.' })

        // Verificar que la fecha del partido no haya pasado (Colombia GMT-5, nivel día)
        if (polla.fecha_partido) {
          const nowCol = new Date(Date.now() - 5 * 3600 * 1000)
          const todayCol = nowCol.toISOString().slice(0, 10)
          const matchDate = String(polla.fecha_partido).slice(0, 10)
          if (matchDate < todayCol) {
            return res.status(400).json({ error: 'El partido ya finalizó. No se aceptan más predicciones.' })
          }
        }

        if (!polla.permite_repetir || polla.max_repeticiones) {
          const { data: existing } = await sbGet(
            `/votos?polla_id=eq.${polla_id}&goles_local=eq.${goles_local}&goles_visitante=eq.${goles_visitante}`
          )
          const count = Array.isArray(existing) ? existing.length : 0
          if (!polla.permite_repetir && count > 0)
            return res.status(400).json({ error: 'Ese marcador ya fue tomado. Elige uno diferente.' })
          if (polla.max_repeticiones && count >= polla.max_repeticiones)
            return res.status(400).json({ error: `Ese marcador ya alcanzó el máximo de ${polla.max_repeticiones} repetición(es).` })
        }

        const { ok, data } = await sbInsert('votos', {
          polla_id,
          participante_nombre: String(participante_nombre).trim(),
          goles_local:         Number(goles_local),
          goles_visitante:     Number(goles_visitante),
        })
        if (!ok) return res.status(400).json({ error: data?.message || 'Error al guardar el voto' })
        return res.status(200).json({ ok: true })
      }

      // ── cerrar polla ──────────────────────────────────────────────────────
      if (action === 'cerrar') {
        const { polla_id, token } = body
        if (!polla_id) return res.status(400).json({ error: 'polla_id requerido' })
        const auth = await verificarToken(polla_id, token)
        if (!auth) return res.status(403).json({ error: 'No autorizado' })
        const { ok } = await sbPatch('pollas', `id=eq.${polla_id}`, { activa: false })
        if (!ok) return res.status(400).json({ error: 'Error al cerrar la polla' })
        return res.status(200).json({ ok: true })
      }

      // ── reabrir polla ─────────────────────────────────────────────────────
      if (action === 'reabrir') {
        const { polla_id, token } = body
        if (!polla_id) return res.status(400).json({ error: 'polla_id requerido' })
        const auth = await verificarToken(polla_id, token)
        if (!auth) return res.status(403).json({ error: 'No autorizado' })
        const { ok } = await sbPatch('pollas', `id=eq.${polla_id}`, { activa: true })
        if (!ok) return res.status(400).json({ error: 'Error al reabrir la polla' })
        return res.status(200).json({ ok: true })
      }

      // ── eliminar voto ─────────────────────────────────────────────────────
      if (action === 'eliminar-voto') {
        const { voto_id, polla_id, token } = body
        if (!voto_id) return res.status(400).json({ error: 'voto_id requerido' })
        const auth = await verificarToken(polla_id, token)
        if (!auth) return res.status(403).json({ error: 'No autorizado' })
        const { ok } = await sbDelete('votos', `id=eq.${voto_id}`)
        if (!ok) return res.status(400).json({ error: 'Error al eliminar el voto' })
        return res.status(200).json({ ok: true })
      }

      return res.status(400).json({ error: `Acción desconocida: ${action}` })
    }

    return res.status(405).json({ error: 'Método no permitido' })
  } catch (err) {
    console.error('[api/polla]', err)
    return res.status(500).json({ error: err.message })
  }
}
