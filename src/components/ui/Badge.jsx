import { getConfederationColor } from '../../utils/helpers'

export function ConfederationBadge({ confederation }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getConfederationColor(confederation)}`}>
      {confederation}
    </span>
  )
}

export function GroupBadge({ group }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 bg-sky-500/15 text-sky-400 text-xs font-bold rounded-lg border border-sky-500/30">
      {group}
    </span>
  )
}

export function StatusBadge({ status }) {
  const isLive = ['live','1H','HT','2H','ET','PEN'].includes(status)
  if (isLive) return <span className="badge-live">⚡ En Vivo</span>
  if (status === 'finished') return <span className="badge-finished">Finalizado</span>
  return <span className="badge-upcoming">Próximo</span>
}

export function RankBadge({ rank }) {
  const color =
    rank === 1 ? 'text-amber-400' :
    rank === 2 ? 'text-slate-300' :
    rank === 3 ? 'text-amber-700' : 'text-slate-500'
  return <span className={`font-bold tabular-nums ${color}`}>{rank}</span>
}
