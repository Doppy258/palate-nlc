import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import { useStore } from './store/useStore'
import { AppShell } from './components/AppShell'
import { BottomNav } from './components/BottomNav'
import { Toaster } from './components/Toaster'
import Onboarding from './screens/Onboarding'
import Discover from './screens/Discover'
import RestaurantDetail from './screens/RestaurantDetail'
import Rank from './screens/Rank'
import Passport from './screens/Passport'
import Bites from './screens/Bites'
import Profile from './screens/Profile'
import OwnerDashboard from './screens/owner/OwnerDashboard'
import Landing from './screens/Landing'

const NAV_PATHS = ['/discover', '/rank', '/passport', '/profile', '/bites']
const showNav = (path: string) => NAV_PATHS.includes(path) || path.startsWith('/r/')

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  const location = useLocation()
  const chrome = showNav(location.pathname)

  if (location.pathname === '/') {
    return (
      <IconContext.Provider value={{ size: 18, weight: 'regular' }}>
        <Landing />
      </IconContext.Provider>
    )
  }

  return (
    <IconContext.Provider value={{ size: 18, weight: 'regular' }}>
      <AppShell chrome={chrome}>
        <div className="flex h-full flex-col">
          <div className="relative min-h-0 flex-1">
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/rank" element={<Rank />} />
              <Route path="/passport" element={<Passport />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/bites" element={<Bites />} />
              <Route path="/r/:id" element={<RestaurantDetail />} />
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="*" element={<Navigate to={onboarded ? '/discover' : '/onboarding'} replace />} />
            </Routes>
          </div>
          {chrome && <BottomNav />}
        </div>
        <Toaster />
      </AppShell>
    </IconContext.Provider>
  )
}
