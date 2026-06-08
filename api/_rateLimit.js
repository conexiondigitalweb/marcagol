// In-memory rate limiter — state is per-function-instance, resets on cold start.
// Good enough for basic abuse protection; not a distributed solution.
const store = new Map()
const WINDOW = 60_000 // 1 min

export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

export function rateLimit(ip, max) {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now - entry.start > WINDOW) {
    store.set(ip, { count: 1, start: now })
    return { limited: false, remaining: max - 1 }
  }

  if (entry.count >= max) {
    const resetIn = Math.ceil((WINDOW - (now - entry.start)) / 1000)
    return { limited: true, remaining: 0, resetIn }
  }

  entry.count++
  return { limited: false, remaining: max - entry.count }
}

// Evitar crecimiento ilimitado del Map en instancias de larga vida
setInterval(() => {
  const cutoff = Date.now() - WINDOW * 2
  for (const [key, val] of store) {
    if (val.start < cutoff) store.delete(key)
  }
}, WINDOW)
