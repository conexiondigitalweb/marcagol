const FT_STATUSES = new Set(['FT', 'AET', 'PEN'])

// Determina el ganador de una lista de partidos R32 terminados.
// Devuelve { [matchId]: { team: { name, id }, confirmed: true } }
export async function getKnockoutWinners(r32Matches) {
  const pending = r32Matches.filter(m => m.fixtureId)
  if (!pending.length) return {}

  const winners = {}

  await Promise.allSettled(pending.map(async match => {
    try {
      const res = await fetch(`/api/football?endpoint=/fixtures&id=${match.fixtureId}`)
      if (!res.ok) return
      const data = await res.json()
      const fixture = data?.response?.[0]
      if (!fixture) return

      const status = fixture.fixture?.status?.short
      if (!FT_STATUSES.has(status)) return

      const homeGoals = fixture.goals?.home ?? 0
      const awayGoals = fixture.goals?.away ?? 0
      const penHome   = fixture.score?.penalty?.home
      const penAway   = fixture.score?.penalty?.away

      let winner = null
      if (homeGoals > awayGoals) {
        winner = fixture.teams?.home
      } else if (awayGoals > homeGoals) {
        winner = fixture.teams?.away
      } else if (penHome != null && penAway != null) {
        winner = penHome > penAway ? fixture.teams?.home : fixture.teams?.away
      }

      if (winner) {
        winners[match.matchId] = { team: winner, confirmed: true }
      }
    } catch (e) {
      console.warn(`Winner fetch M${match.matchId}:`, e)
    }
  }))

  return winners
}
