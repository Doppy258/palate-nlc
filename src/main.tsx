import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './index.css'
import App from './App'
import Landing from './screens/Landing'
import { PalateProvider } from './providers/PalateProvider'
import { AuthProvider } from './providers/AuthProvider'
import { IconContext } from '@phosphor-icons/react'

function AppWithProviders() {
  return (
    <PalateProvider>
      <App />
    </PalateProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <IconContext.Provider value={{ size: 18, weight: 'regular' }}>
                <Landing />
              </IconContext.Provider>
            }
          />
          <Route path="/*" element={<AppWithProviders />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
