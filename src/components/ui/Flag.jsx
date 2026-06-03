const FLAGCDN_DIM = {
  xs:  '20x15',
  sm:  '28x21',
  md:  '40x30',
  lg:  '56x42',
  xl:  '80x60',
}

export default function Flag({ iso2, size = 'md', className = '' }) {
  if (!iso2) return null
  const dim = FLAGCDN_DIM[size] || '40x30'
  const [w, h] = dim.split('x').map(Number)
  const src = `https://flagcdn.com/${dim}/${iso2.toLowerCase()}.png`

  return (
    <img
      src={src}
      alt={iso2}
      width={w}
      height={h}
      className={`object-cover flex-shrink-0 ${className}`}
      style={{ borderRadius: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }}
      loading="lazy"
      onError={e => { e.currentTarget.style.opacity = '0.3' }}
    />
  )
}
