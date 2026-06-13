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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // ── GET: polla + votos ────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'id requerido' })

      const { data: pollas, ok: pOk } = await sbGet(`/pollas?id=eq.${id}&limit=1`)
      if (!pOk || !Array.isArray(pollas) || pollas.length === 0)
        return res.status(404).json({ error: 'Polla no encontrada' })

      const { data: votos } = await sbGet(`/votos?polla_id=eq.${id}&order=created_at.asc`)
      return res.status(200).json({ polla: pollas[0], votos: votos || [] })
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

        const { data, ok } = await sbInsert('pollas', {
          partido_id:       Number(partido_id),
          equipo_local,
          equipo_visitante,
          fecha_partido,
          creador_nombre,
          permite_repetir:  !!permite_repetir,
          max_repeticiones: max_repeticiones ? Number(max_repeticiones) : null,
          activa:           true,
        })
        if (!ok) return res.status(400).json({ error: data?.message || 'Error al crear la polla' })
        return res.status(200).json({ id: data.id })
      }

      // ── votar ─────────────────────────────────────────────────────────────
      if (action === 'votar') {
        const { polla_id, participante_nombre, goles_local, goles_visitante } = body

        if (!polla_id || !participante_nombre || goles_local == null || goles_visitante == null)
          return res.status(400).json({ error: 'Faltan campos requeridos' })

        // Fetch polla para validar reglas
        const { data: pollas } = await sbGet(`/pollas?id=eq.${polla_id}&limit=1`)
        const polla = Array.isArray(pollas) ? pollas[0] : null
        if (!polla) return res.status(404).json({ error: 'Polla no encontrada' })

        // Validar repeticiones
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

      return res.status(400).json({ error: `Acción desconocida: ${action}` })
    }

    return res.status(405).json({ error: 'Método no permitido' })
  } catch (err) {
    console.error('[api/polla]', err)
    return res.status(500).json({ error: err.message })
  }
}
