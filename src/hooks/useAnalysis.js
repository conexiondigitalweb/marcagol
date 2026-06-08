import { useState, useCallback, useRef } from 'react'

// In-memory cache per session, keyed by "matchId:question"
const cache = new Map()

function cacheKey(matchId, message) {
  return `${matchId || 'global'}:${message}`
}

export function useAnalysis() {
  const [text, setText]           = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const abortRef = useRef(null)

  const ask = useCallback(async ({ system, message, matchId } = {}) => {
    if (!message?.trim()) return

    const key = cacheKey(matchId, message)
    if (cache.has(key)) {
      setText(cache.get(key))
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setText('')
    setError(null)
    setLoading(true)
    setStreaming(false)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system, message, matchId, stream: true }),
        signal: abortRef.current.signal,
      })

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        setLoading(false)
        setStreaming(true)

        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let accumulated = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += dec.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() // keep incomplete trailing line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') continue
            try {
              const evt = JSON.parse(raw)
              if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
                accumulated += evt.delta.text
                setText(accumulated)
              }
            } catch {}
          }
        }

        if (accumulated) cache.set(key, accumulated)
        setStreaming(false)
      } else {
        // Fallback: JSON (non-streaming or error response)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        const result = data.text || ''
        setText(result)
        if (result) cache.set(key, result)
        setLoading(false)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Error al conectar con el análisis. Intenta de nuevo.')
      }
      setLoading(false)
      setStreaming(false)
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setText('')
    setError(null)
    setLoading(false)
    setStreaming(false)
  }, [])

  return { text, streaming, loading, error, ask, reset }
}
