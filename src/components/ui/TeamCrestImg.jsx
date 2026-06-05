import { useState } from 'react'
import { getTeamCrestUrl } from '../../services/footballApi'

// Renders team crest from media.api-sports.io (no auth needed).
// Falls back to `fallback` prop if no ID mapping or image fails to load.
export default function TeamCrestImg({
  code,
  name,
  size = 32,
  className = '',
  style = {},
  fallback = null,
}) {
  const [err, setErr] = useState(false)
  const url = getTeamCrestUrl(code)

  if (url && !err) {
    return (
      <img
        src={url}
        alt={name || code}
        width={size}
        height={size}
        className={`object-contain flex-shrink-0 ${className}`}
        style={style}
        onError={() => setErr(true)}
        loading="lazy"
      />
    )
  }

  return fallback
}
