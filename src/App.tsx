import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import { useStore } from './store/useStore'
import { usePalate } from './providers/PalateProvider'
import { useAuth } from './providers/AuthProvider'
import { AppShell } from './components/AppShell'
import { BottomNav } from './components/BottomNav'
import { Toaster } from './components/Toaster'
import Login from './screens/Login'
import Signup from './screens/Signup'
import Onboarding from './screens/Onboarding'
import Discover from './screens/Discover'
import RestaurantDetail from './screens/RestaurantDetail'
import Rank from './screens/Rank'
import Passport from './screens/Passport'
import Bites from './screens/Bites'
import FindFriends from './screens/FindFriends'
import Profile from './screens/Profile'
import OwnerDashboard from './screens/owner/OwnerDashboard'

const NAV_PATHS = ['/discover', '/rank', '/passport', '/profile', '/bites']
const showNav = (path: string) => NAV_PATHS.includes(path) || path.startsWith('/r/')

function LoadingScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-canvas">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ember" />
        <p className="mt-3 text-sm text-ink-soft">Loading Palate…</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-canvas px-6">
      <div className="max-w-sm text-center">
        <p className="text-sm font-semibold text-ink">Could not connect to the server</p>
        <p className="mt-2 text-[13px] text-ink-soft">{message}</p>
        <p className="mt-3 text-[12px] text-ink-faint">Run <code className="rounded bg-surface-2 px-1">npm run dev</code> to start the API and frontend together.</p>
      </div>
    </div>
  )
}

function AppContent() {
  const onboarded = useStore((s) => s.onboarded)
  const { loading, error } = usePalate()
  const location = useLocation()
  const chrome = showNav(location.pathname)

  if (loading) {
    return (
      <IconContext.Provider value={{ size: 18, weight: 'regular' }}>
        <AppShell chrome={false}>
          <LoadingScreen />
        </AppShell>
      </IconContext.Provider>
    )
  }

  if (error) {
    return (
      <IconContext.Provider value={{ size: 18, weight: 'regular' }}>
        <AppShell chrome={false}>
          <ErrorScreen message={error} />
        </AppShell>
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
              <Route path="/friends" element={<FindFriends />} />
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

function AuthContent() {
  return (
    <IconContext.Provider value={{ size: 18, weight: 'regular' }}>
      <AppShell chrome={false}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppShell>
    </IconContext.Provider>
  )
}

export default function App() {
  const { loading: authLoading, token } = useAuth()

  if (authLoading) {
    return (
      <IconContext.Provider value={{ size: 18, weight: 'regular' }}>
        <AppShell chrome={false}>
          <LoadingScreen />
        </AppShell>
      </IconContext.Provider>
    )
  }

  if (!token) {
    return <AuthContent />
  }

  return <AppContent />
}
