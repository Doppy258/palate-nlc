import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ForkKnife, Eye, EyeSlash } from '@phosphor-icons/react'
import { useAuth } from '../providers/AuthProvider'
import { Button } from '../components/ui'
import { Reveal } from '../components/Reveal'

export default function Login() {
  const navigate = useNavigate()
  const { signin, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)

    try {
      await signin(email, password)
      navigate('/onboarding', { replace: true })
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-6 pb-7 pt-7 lg:items-center lg:justify-center lg:px-8">
      <div className="flex w-full flex-1 flex-col lg:max-w-md lg:flex-none lg:rounded-[24px] lg:border lg:border-line lg:bg-surface lg:p-8 lg:shadow-pop">
        <Reveal>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] bg-ember text-white">
              <ForkKnife size={19} weight="fill" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-ink">Palate</span>
          </div>
        </Reveal>

        <Reveal delay={0.05} className="mt-8">
          <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-2 text-[14px] text-ink-soft">Sign in to continue to Palate</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder-ink-faint focus:border-ember focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder-ink-faint focus:border-ember focus:outline-none"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                  disabled={loading}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {(formError || error) && (
              <div className="rounded-lg bg-red-tint px-4 py-2.5 text-sm text-red">
                {formError || error}
              </div>
            )}

            <Button full size="lg" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Reveal>

        <Reveal delay={0.15} className="mt-6">
          <p className="text-center text-[13px] text-ink-soft">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-ember hover:underline">
              Create one
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  )
}
