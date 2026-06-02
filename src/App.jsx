import { Routes, Route } from 'react-router-dom'
import Header     from './components/layout/Header'
import Footer     from './components/layout/Footer'
import Dashboard  from './pages/Dashboard'
import Groups     from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Bracket    from './pages/Bracket'
import Teams      from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Predictions from './pages/Predictions'
import Broadcast  from './pages/Broadcast'
import Schedule   from './pages/Schedule'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl animate-fade-in">
        <Routes>
          <Route path="/"              element={<Dashboard />}  />
          <Route path="/grupos"        element={<Groups />}     />
          <Route path="/grupos/:id"    element={<GroupDetail />}/>
          <Route path="/llaves"        element={<Bracket />}    />
          <Route path="/equipos"       element={<Teams />}      />
          <Route path="/equipos/:code" element={<TeamDetail />} />
          <Route path="/predicciones"  element={<Predictions />}/>
          <Route path="/calendario"    element={<Schedule />}   />
          <Route path="/donde-ver"     element={<Broadcast />}  />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
