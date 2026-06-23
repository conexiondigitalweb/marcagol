import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { PredictionsProvider } from './context/PredictionsContext.jsx'
import { runCacheInvalidation } from './cacheManager'
import { CACHE_VERSION } from './cacheConfig'
import './index.css'

// Ejecutar antes de cualquier render — garantiza localStorage limpio antes de
// que PredictionsProvider y demás contextos lean sus keys síncronamente.
runCacheInvalidation(CACHE_VERSION)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <PredictionsProvider>
          <App />
        </PredictionsProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
