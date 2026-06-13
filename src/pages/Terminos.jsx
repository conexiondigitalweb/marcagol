import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    n: '1',
    title: 'Aceptación de los Términos',
    content: (
      <p>
        Al acceder y utilizar Marcagol.live, usted acepta cumplir con estos Términos y
        Condiciones. Si no está de acuerdo con alguno de estos términos, le solicitamos
        no utilizar la plataforma.
      </p>
    ),
  },
  {
    n: '2',
    title: 'Descripción del Servicio',
    content: (
      <p>
        Marcagol.live es una plataforma digital de seguimiento deportivo que ofrece
        información en tiempo real sobre la Copa Mundial FIFA 2026, incluyendo marcadores,
        estadísticas, alineaciones y una funcionalidad de predicciones de marcador entre
        usuarios ("Pollas de Marcador"). El servicio es de carácter informativo y de
        entretenimiento.
      </p>
    ),
  },
  {
    n: '3',
    title: 'Información Deportiva',
    content: (
      <p>
        Los datos deportivos mostrados en Marcagol.live provienen de fuentes externas
        (API-Football) y pueden presentar retrasos, inexactitudes o interrupciones fuera
        de nuestro control. Marcagol.live no garantiza la exactitud, completitud o
        disponibilidad en tiempo real de la información deportiva. No nos hacemos
        responsables por decisiones tomadas con base en la información publicada en la
        plataforma.
      </p>
    ),
  },
  {
    n: '4',
    title: 'Funcionalidad "Pollas de Marcador"',
    content: (
      <div className="space-y-3">
        <p>
          <span className="text-slate-400 font-semibold">4.1 </span>
          La funcionalidad de "Pollas de Marcador" es una herramienta de entretenimiento
          que permite a grupos de usuarios predecir resultados deportivos de manera
          informal.
        </p>
        <p>
          <span className="text-slate-400 font-semibold">4.2 </span>
          Marcagol.live <strong className="text-white">NO</strong> es una plataforma de
          apuestas deportivas, <strong className="text-white">NO</strong> facilita,
          promueve ni autoriza el intercambio de dinero entre usuarios, y{' '}
          <strong className="text-white">NO</strong> interviene en acuerdos económicos
          privados que los usuarios puedan realizar entre sí.
        </p>
        <p>
          <span className="text-slate-400 font-semibold">4.3 </span>
          Cualquier acuerdo económico realizado entre usuarios a partir del uso de esta
          funcionalidad es de exclusiva responsabilidad de las partes involucradas.
          Marcagol.live queda completamente exento de cualquier reclamación, disputa o
          consecuencia legal derivada de dichos acuerdos.
        </p>
        <p>
          <span className="text-slate-400 font-semibold">4.4 </span>
          El uso de la funcionalidad de predicciones con fines de apuesta de dinero puede
          estar sujeto a regulaciones legales en su país o región. Es responsabilidad del
          usuario conocer y cumplir con la legislación aplicable en su jurisdicción.
        </p>
      </div>
    ),
  },
  {
    n: '5',
    title: 'Datos de los Usuarios',
    content: (
      <div className="space-y-3">
        <p>
          <span className="text-slate-400 font-semibold">5.1 </span>
          Marcagol.live recopila únicamente el nombre o apodo que el usuario ingresa
          voluntariamente al crear o participar en una Polla de Marcador. Este dato es
          visible para otros participantes de la misma polla.
        </p>
        <p>
          <span className="text-slate-400 font-semibold">5.2 </span>
          No recopilamos datos de identificación personal, correos electrónicos, números
          de teléfono ni información de pago.
        </p>
        <p>
          <span className="text-slate-400 font-semibold">5.3 </span>
          Los nombres ingresados se almacenan en nuestros servidores con el único fin de
          identificar las predicciones dentro de cada polla. El usuario acepta que este
          dato sea visible para los demás participantes de la polla en la que participe.
        </p>
        <p>
          <span className="text-slate-400 font-semibold">5.4 </span>
          El usuario puede solicitar la eliminación de sus datos contactándonos a través
          de nuestras redes sociales oficiales.
        </p>
      </div>
    ),
  },
  {
    n: '6',
    title: 'Propiedad Intelectual',
    content: (
      <p>
        El diseño, logotipo, nombre "Marcagol.live" y el código fuente de la plataforma
        son propiedad de Conexión Digital Web. Queda prohibida su reproducción,
        distribución o uso comercial sin autorización expresa por escrito.
      </p>
    ),
  },
  {
    n: '7',
    title: 'Limitación de Responsabilidad',
    content: (
      <p>
        Marcagol.live se proporciona "tal cual" y "según disponibilidad". No garantizamos
        que el servicio sea ininterrumpido, libre de errores o que los resultados sean
        precisos. En ningún caso Marcagol.live, sus propietarios, colaboradores o
        proveedores serán responsables por daños directos, indirectos, incidentales o
        consecuentes derivados del uso o la imposibilidad de uso del servicio.
      </p>
    ),
  },
  {
    n: '8',
    title: 'Modificaciones al Servicio y a los Términos',
    content: (
      <p>
        Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en
        cualquier momento sin previo aviso. Asimismo, podemos actualizar estos Términos y
        Condiciones. El uso continuado de la plataforma después de cualquier modificación
        constituye la aceptación de los nuevos términos.
      </p>
    ),
  },
  {
    n: '9',
    title: 'Conducta del Usuario',
    content: (
      <div className="space-y-2">
        <p>El usuario se compromete a:</p>
        <ul className="space-y-1.5 pl-1">
          {[
            'Usar la plataforma de manera lícita y respetuosa.',
            'No usar nombres ofensivos, discriminatorios o inapropiados.',
            'No intentar manipular, hackear o interferir con el funcionamiento de la plataforma.',
            'No usar la plataforma para actividades ilegales.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-sky-500 mt-1 flex-shrink-0">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="pt-1">
          El incumplimiento de estas normas puede resultar en la eliminación del contenido
          del usuario sin previo aviso.
        </p>
      </div>
    ),
  },
  {
    n: '10',
    title: 'Legislación Aplicable',
    content: (
      <p>
        Estos términos se rigen por las leyes de la República de Colombia. Cualquier
        disputa será sometida a la jurisdicción de los tribunales competentes de la ciudad
        de Bogotá, Colombia.
      </p>
    ),
  },
  {
    n: '11',
    title: 'Contacto',
    content: (
      <div className="space-y-2">
        <p>
          Para consultas, reportes o solicitudes relacionadas con estos términos, puede
          contactarnos a través de:
        </p>
        <div className="flex flex-col gap-1.5 pl-1">
          <a
            href="https://instagram.com/marcagollive"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
          >
            <span>·</span>
            Instagram: @marcagollive
          </a>
          <a
            href="https://facebook.com/marcagol.live"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
          >
            <span>·</span>
            Facebook: Marcagol.live
          </a>
        </div>
      </div>
    ),
  },
]

export default function Terminos() {
  return (
    <div className="max-w-3xl mx-auto animate-slide-up py-2">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-700/60">
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: '#F97316' }}>●</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">marcagol.live</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">
          Términos y Condiciones de Uso
        </h1>
        <p className="text-sm text-slate-500">Última actualización: 13 de junio de 2026</p>
      </div>

      {/* Secciones */}
      <div className="space-y-6">
        {SECTIONS.map(sec => (
          <div
            key={sec.n}
            className="rounded-xl p-5 border border-slate-700/40"
            style={{ backgroundColor: '#1E293B' }}
          >
            <h2 className="flex items-baseline gap-2.5 font-bold text-base mb-3" style={{ color: '#38BDF8' }}>
              <span
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-xs font-black"
                style={{ background: 'rgba(56,189,248,0.12)', color: '#38BDF8' }}
              >
                {sec.n}
              </span>
              {sec.title}
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed">
              {sec.content}
            </div>
          </div>
        ))}
      </div>

      {/* Footer de página */}
      <div className="mt-10 pt-6 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-600 text-center sm:text-left">
          © 2026 Marcagol.live · Conexión Digital Web · Colombia
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: '#F97316' }}
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}
