export const config = { api: { bodyParser: true } }

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function callAnthropic(apiKey, payload, attempt = 0) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  })

  // 529 = overloaded — reintentar con backoff exponencial
  if (res.status === 529 && attempt < 3) {
    const wait = Math.pow(2, attempt) * 1500 // 1.5s → 3s → 6s
    await sleep(wait)
    return callAnthropic(apiKey, payload, attempt + 1)
  }

  return res
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  const { system, message, stream: wantStream, matchId } = body

  if (!message) {
    return res.status(400).json({ error: 'message requerido' })
  }

  const apiKey = process.env.VITE_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' })

  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    system: system || 'Eres un analista deportivo experto del Mundial 2026. Responde en español, de forma concisa, directa y apasionada.',
    messages: [{ role: 'user', content: message }],
  }

  try {
    // ── MODO STREAMING ──────────────────────────────────────────
    if (wantStream) {
      payload.stream = true

      const upstream = await callAnthropic(apiKey, payload)

      if (!upstream.ok) {
        const err = await upstream.json().catch(() => ({}))
        return res.status(200).json({
          error: err.error?.message || `Error ${upstream.status}`,
          text: '',
          retried: true,
        })
      }

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('X-Accel-Buffering', 'no')

      const reader = upstream.body.getReader()
      const dec = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(dec.decode(value, { stream: true }))
      }

      return res.end()
    }

    // ── MODO NORMAL (backward compatible) ───────────────────────
    const upstream = await callAnthropic(apiKey, payload)
    const data = await upstream.json()

    if (!upstream.ok) {
      return res.status(200).json({
        error: data.error?.message || 'Error API',
        text: '',
      })
    }

    const text = data.content?.map(c => c.text || '').join('') || ''
    return res.status(200).json({ text, matchId })

  } catch (err) {
    return res.status(200).json({ error: err.message, text: '' })
  }
}