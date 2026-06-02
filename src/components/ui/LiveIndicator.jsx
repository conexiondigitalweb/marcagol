export default function LiveIndicator({ minute, size = 'sm' }) {
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs'
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      <span className={`text-red-400 font-bold uppercase tracking-wider ${textSize}`}>
        {minute ? `${minute}'` : 'EN VIVO'}
      </span>
    </div>
  )
}
