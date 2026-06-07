import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (dateStr) =>
  format(new Date(dateStr + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })

export const formatDateShort = (dateStr) =>
  format(new Date(dateStr + 'T12:00:00'), "d MMM", { locale: es })

export const formatDayOfWeek = (dateStr) =>
  format(new Date(dateStr + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })

export const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1)

export const formatTime = (timeStr) => timeStr.slice(0, 5) + ' UTC'

export const getStatusLabel = (status) => {
  const labels = {
    scheduled: 'Próximo', live: 'En Vivo', '1H': '1er Tiempo',
    HT: 'Descanso', '2H': '2do Tiempo', ET: 'Prórroga',
    PEN: 'Penales', finished: 'Finalizado',
  }
  return labels[status] || status
}

export const getConfederationColor = (confederation) => {
  const colors = {
    UEFA:     'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    CONMEBOL: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    CONCACAF: 'bg-red-500/20 text-red-400 border border-red-500/30',
    CAF:      'bg-teal-500/20 text-teal-400 border border-teal-500/30',
    AFC:      'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    OFC:      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  }
  return colors[confederation] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
}

export const sortTeams = (teams) => {
  // Si ningún equipo ha jugado, mantener el orden del sorteo oficial
  const anyPlayed = teams.some(t => t.played > 0)
  if (!anyPlayed) return [...teams]
  // Con partidos jugados, ordenar por puntos, DG, GF
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.name.localeCompare(b.name)
  })
}

export const getCountdown = (targetDateStr) => {
  const diff = new Date(targetDateStr) - new Date()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export const calculatePredictionPoints = (pred, homeScore, awayScore) => {
  if (homeScore === null || awayScore === null) return null
  if (pred.home === homeScore && pred.away === awayScore) return 3
  const pr = Math.sign(pred.home - pred.away)
  const ar = Math.sign(homeScore - awayScore)
  return pr === ar ? 1 : 0
}

export const flagUrl = (iso2, size = 40) =>
  `https://flagcdn.com/w${size}/${iso2.toLowerCase()}.png`

export const groupMatchesByDate = (matches) => {
  const grouped = {}
  matches.forEach(m => {
    if (!grouped[m.date]) grouped[m.date] = []
    grouped[m.date].push(m)
  })
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ms]) => [date, [...ms].sort((a, b) => (a.time || '').localeCompare(b.time || ''))])
}