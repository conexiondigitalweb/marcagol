import { useState, useEffect } from 'react'
import { getTeamCrest } from '../../services/footballApi'

// Shows team crest from API-Football; renders fallback if unavailable.
export default function TeamCrestImg({ code, name, size = 32, className = '', fallback = null }) {
  const [url, setUrl] = useState(undefined)  // undefined=loading, null=none, str=url
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (!code && !name) { setUrl(null); return }
    let active = true
    getTeamCrest(code, name).then(u => { if (active) setUrl(u) })
    return () => { active = false }
  }, [code, name])

  if (url && !err) {
    return (
      <img
        src={url}
        alt={name || code}
        width={size}
        height={size}
        className={`object-contain flex-shrink-0 ${className}`}
        onError={() => setErr(true)}
        loading="lazy"
      />
    )
  }

  // While loading (undefined) or no crest (null or error), show fallback
  return fallback
}
