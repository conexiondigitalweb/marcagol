import { Component, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header        from './components/layout/Header'
import Footer        from './components/layout/Footer'
import LoadingSpinner from './components/ui/LoadingSpinner'
import InstallPrompt from './components/InstallPrompt'
import UpdatePrompt  from './components/UpdatePrompt'
import { Analytics } from '@vercel/analytics/react'

const Dashboard   = lazy(() => import('./pages/Dashboard'))
const Groups      = lazy(() => import('./pages/Groups'))
const GroupDetail = lazy(() => import('./pages/GroupDetail'))
const Bracket     = lazy(() => import('./pages/Bracket'))
const Teams       = lazy(() => import('./pages/Teams'))
const TeamDetail  = lazy(() => import('./pages/TeamDetail'))
const Predictions = lazy(() => import('./pages/Predictions'))
const Schedule    = lazy(() => import('./pages/Schedule'))
const News        = lazy(() => import('./pages/News'))
const Broadcast   = lazy(() => import('./pages/Broadcast'))
const History     = lazy(() => import('./pages/History'))
const Scorers     = lazy(() => import('./pages/Scorers'))
const MatchDetail    = lazy(() => import('./pages/MatchDetail'))
const PlayerProfile  = lazy(() => import('./pages/PlayerProfile'))
const CrearPolla     = lazy(() => import('./pages/CrearPolla'))
const PollaDetalle   = lazy(() => import('./pages/PollaDetalle'))
const MisPollas      = lazy(() => import('./pages/MisPollas'))
const Terminos       = lazy(() => import('./pages/Terminos'))
const PollasActivas  = lazy(() => import('./pages/PollasActivas'))

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-slate-400 text-sm">Algo salió mal al cargar la página.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-lg font-semibold text-white text-sm"
            style={{ background: '#F97316' }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl animate-fade-in">
        <Suspense fallback={<LoadingSpinner fullPage />}>
          <Routes>
            <Route path="/"              element={<Dashboard />}  />
            <Route path="/grupos"        element={<Groups />}     />
            <Route path="/grupos/:id"    element={<GroupDetail />}/>
            <Route path="/llaves"        element={<Bracket />}    />
            <Route path="/equipos"       element={<Teams />}      />
            <Route path="/equipos/:code" element={<TeamDetail />} />
            <Route path="/predicciones"  element={<Predictions />}/>
            <Route path="/calendario"    element={<Schedule />}   />
            <Route path="/noticias"      element={<News />}       />
            <Route path="/donde-ver"     element={<Broadcast />}  />
            <Route path="/historia"      element={<History />}    />
            <Route path="/goleadores"    element={<Scorers />}    />
            <Route path="/partido/:id"   element={<MatchDetail />}/>
            <Route path="/jugador/:team/:number" element={<PlayerProfile />}/>
            <Route path="/crear-polla"   element={<CrearPolla />}  />
            <Route path="/polla/:id"     element={<PollaDetalle />}/>
            <Route path="/mis-pollas"    element={<MisPollas />}   />
            <Route path="/terminos"        element={<Terminos />}      />
            <Route path="/pollas-activas" element={<PollasActivas />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <InstallPrompt />
      <UpdatePrompt />
    </div>
    <Analytics />
    </ErrorBoundary>
  )
}
