import { flagUrl } from '../../utils/helpers'

const SIZE_MAP = { xs: 20, sm: 28, md: 40, lg: 56, xl: 80 }

export default function Flag({ iso2, size = 'md', className = '' }) {
  const px  = SIZE_MAP[size] || 40
  const src = flagUrl(iso2, px * 2)

  return (
    <img
      src={src}
      alt={iso2}
      width={px}
      height={Math.round(px * 0.67)}
      className={`object-cover rounded-sm flex-shrink-0 ${className}`}
      loading="lazy"
      onError={e => { e.currentTarget.style.opacity = '0.3' }}
    />
  )
}
