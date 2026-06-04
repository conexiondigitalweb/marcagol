const CHAMPIONS = [
  { year: 1930, champion: 'Uruguay',        runner: 'Argentina',        score: '4-2',      host: 'Uruguay' },
  { year: 1934, champion: 'Italia',         runner: 'Checoslovaquia',   score: '2-1',      host: 'Italia' },
  { year: 1938, champion: 'Italia',         runner: 'Hungría',          score: '4-2',      host: 'Francia' },
  { year: 1950, champion: 'Uruguay',        runner: 'Brasil',           score: 'Maracanazo', host: 'Brasil' },
  { year: 1954, champion: 'Alemania Occ.', runner: 'Hungría',          score: '3-2',      host: 'Suiza' },
  { year: 1958, champion: 'Brasil',         runner: 'Suecia',           score: '5-2',      host: 'Suecia' },
  { year: 1962, champion: 'Brasil',         runner: 'Checoslovaquia',   score: '3-1',      host: 'Chile' },
  { year: 1966, champion: 'Inglaterra',     runner: 'Alemania Occ.',   score: '4-2',      host: 'Inglaterra' },
  { year: 1970, champion: 'Brasil',         runner: 'Italia',           score: '4-1',      host: 'México' },
  { year: 1974, champion: 'Alemania Occ.', runner: 'Países Bajos',    score: '2-1',      host: 'Alemania Occ.' },
  { year: 1978, champion: 'Argentina',      runner: 'Países Bajos',    score: '3-1',      host: 'Argentina' },
  { year: 1982, champion: 'Italia',         runner: 'Alemania Occ.',   score: '3-1',      host: 'España' },
  { year: 1986, champion: 'Argentina',      runner: 'Alemania Occ.',   score: '3-2',      host: 'México' },
  { year: 1990, champion: 'Alemania Occ.', runner: 'Argentina',        score: '1-0',      host: 'Italia' },
  { year: 1994, champion: 'Brasil',         runner: 'Italia',           score: 'Penales',  host: 'EE.UU.' },
  { year: 1998, champion: 'Francia',        runner: 'Brasil',           score: '3-0',      host: 'Francia' },
  { year: 2002, champion: 'Brasil',         runner: 'Alemania',         score: '2-0',      host: 'Corea/Japón' },
  { year: 2006, champion: 'Italia',         runner: 'Francia',          score: 'Penales',  host: 'Alemania' },
  { year: 2010, champion: 'España',         runner: 'Países Bajos',    score: '1-0',      host: 'Sudáfrica' },
  { year: 2014, champion: 'Alemania',       runner: 'Argentina',        score: '1-0',      host: 'Brasil' },
  { year: 2018, champion: 'Francia',        runner: 'Croacia',          score: '4-2',      host: 'Rusia' },
  { year: 2022, champion: 'Argentina',      runner: 'Francia',          score: 'Penales',  host: 'Qatar' },
];

const PALMARES = [
  { country: 'Brasil',        titles: 5, color: '#22D3EE' },
  { country: 'Alemania',      titles: 4, color: '#3B82F6' },
  { country: 'Italia',        titles: 4, color: '#6366F1' },
  { country: 'Argentina',     titles: 3, color: '#38BDF8' },
  { country: 'Francia',       titles: 2, color: '#8B5CF6' },
  { country: 'Uruguay',       titles: 2, color: '#F59E0B' },
  { country: 'Inglaterra',    titles: 1, color: '#EF4444' },
  { country: 'España',        titles: 1, color: '#F97316' },
];

const SCORERS = [
  { name: 'Miroslav Klose',   country: 'Alemania', goals: 16, years: '2002–2014' },
  { name: 'Ronaldo Nazário',  country: 'Brasil',   goals: 15, years: '1994–2006' },
  { name: 'Gerd Müller',      country: 'Alemania', goals: 14, years: '1970–1974' },
  { name: 'Just Fontaine',    country: 'Francia',  goals: 13, years: '1958 (un torneo)' },
  { name: 'Pelé',             country: 'Brasil',   goals: 12, years: '1958–1970' },
];

const MOMENTS = [
  {
    year: 1950,
    title: 'El Maracanazo',
    desc: 'Uruguay silencia el Maracaná ante 200.000 espectadores y arrebata a Brasil su primera estrella en casa.',
    emoji: '🏟️',
  },
  {
    year: 1958,
    title: 'Nace Pelé',
    desc: 'Con 17 años, Edson Arantes do Nascimento irrumpe en Suecia y el fútbol entra en otra dimensión.',
    emoji: '⭐',
  },
  {
    year: 1986,
    title: 'Maradona Total',
    desc: 'En cuatro minutos Diego marca el "Gol del Siglo" y la "Mano de Dios" frente a Inglaterra. Leyenda pura.',
    emoji: '🤌',
  },
  {
    year: 2014,
    title: 'El 7-1',
    desc: 'Alemania humilla a Brasil en su propia casa. La mayor goleada de una semifinal mundialista en la historia.',
    emoji: '😱',
  },
  {
    year: 2022,
    title: 'Messi completa la historia',
    desc: 'Tras una final épica ante Francia (3-3), Argentina gana en penales y Lionel Messi conquista su única estrella.',
    emoji: '🐐',
  },
];

const MAX_TITLES = Math.max(...PALMARES.map(p => p.titles));

export default function History() {
  return (
    <div className="space-y-10">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border border-sky-800/30 px-6 py-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative">
          <span className="text-5xl">🏆</span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Historia del <span className="text-sky-400">Mundial</span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            92 años de gloria, drama y magia. Desde Uruguay 1930 hasta Qatar 2022.
          </p>
        </div>
      </section>

      {/* Palmarés */}
      <section>
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <span className="text-orange-400">🥇</span> Palmarés histórico
        </h2>
        <div className="grid gap-3">
          {PALMARES.map((p) => (
            <div key={p.country} className="flex items-center gap-4 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/40">
              <span className="text-white font-bold w-28 text-sm shrink-0">{p.country}</span>
              <div className="flex-1 h-3 bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(p.titles / MAX_TITLES) * 100}%`,
                    backgroundColor: p.color,
                  }}
                />
              </div>
              <span className="text-sky-400 font-black text-lg w-6 text-right shrink-0">{p.titles}</span>
              <span className="text-slate-500 text-xs w-10 shrink-0">{p.titles === 1 ? 'título' : 'títulos'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Campeones */}
      <section>
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <span className="text-sky-400">📜</span> Todos los campeones (1930–2022)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-700/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-left">
                <th className="px-4 py-3 font-semibold">Año</th>
                <th className="px-4 py-3 font-semibold">Sede</th>
                <th className="px-4 py-3 font-semibold">Campeón</th>
                <th className="px-4 py-3 font-semibold text-center">Final</th>
                <th className="px-4 py-3 font-semibold">Subcampeón</th>
              </tr>
            </thead>
            <tbody>
              {CHAMPIONS.map((c, i) => (
                <tr
                  key={c.year}
                  className={`border-t border-slate-700/30 transition-colors hover:bg-slate-800/40 ${
                    i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/20'
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-bold text-sky-400">{c.year}</td>
                  <td className="px-4 py-3 text-slate-400">{c.host}</td>
                  <td className="px-4 py-3 font-semibold text-white">{c.champion}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold tabular-nums ${
                      c.score === 'Penales' ? 'text-orange-400' :
                      c.score === 'Maracanazo' ? 'text-yellow-400' : 'text-sky-400'
                    }`}>
                      {c.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.runner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Goleadores históricos */}
      <section>
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <span className="text-orange-400">⚽</span> Máximos goleadores históricos
        </h2>
        <div className="space-y-3">
          {SCORERS.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center gap-4 bg-slate-800/50 rounded-xl px-5 py-4 border border-slate-700/40"
            >
              <span className={`text-2xl font-black w-8 shrink-0 ${
                i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-500'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm leading-tight">{s.name}</p>
                <p className="text-slate-500 text-xs">{s.country} · {s.years}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sky-400 font-black text-xl">{s.goals}</span>
                <span className="text-slate-500 text-xs ml-1">goles</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Momentos icónicos */}
      <section>
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <span className="text-sky-400">✨</span> Momentos icónicos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOMENTS.map((m) => (
            <div
              key={m.year}
              className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/40 p-5 hover:border-sky-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">{m.emoji}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sky-400 font-mono font-bold text-sm">{m.year}</span>
                    <span className="text-orange-400 font-bold text-sm">{m.title}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{m.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <p className="text-center text-slate-600 text-xs pb-4">
        El Mundial 2026 se disputará en EE.UU., Canadá y México — el primero con 48 selecciones.
      </p>
    </div>
  )
}
