export default function LoadingSpinner({ text = 'Cargando...', fullPage = false }) {
  const inner = (
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {text && <p className="text-slate-400 text-sm">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {inner}
      </div>
    )
  }
  return <div className="flex justify-center py-12">{inner}</div>
}
