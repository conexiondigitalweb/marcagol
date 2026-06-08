// api/analyze.js — Vercel Serverless Function
// Proxy seguro para la API de Anthropic
// La clave ANTHROPIC_API_KEY se guarda en variables de entorno de Vercel

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // CORS — permitir desde marcagol.live
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  const { system, message } = req.body

  if (!message) {
    return res.status(400).json({ error: 'message requerido' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: system || 'Eres un analista deportivo experto en fútbol. Responde en español.',
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: err })
    }

    const data = await response.json()
    const text = data.content?.map(c => c.text || '').join('') || ''
    return res.status(200).json({ text })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
