export const config = { api: { bodyParser: true } }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Parsear body manualmente si viene como string
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  const { system, message } = body

  if (!message) {
    return res.status(400).json({ error: 'message requerido', received: JSON.stringify(body) })
  }

  const apiKey = process.env.VITE_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: system || 'Eres un analista deportivo. Responde en español.',
        messages: [{ role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(200).json({ error: data.error?.message || 'Error API', text: '' })

    const text = data.content?.map(c => c.text || '').join('') || ''
    return res.status(200).json({ text })

  } catch (err) {
    return res.status(200).json({ error: err.message, text: '' })
  }
}