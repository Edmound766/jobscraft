import { createFileRoute, Link, useNavigate } from '@tanstack/solid-router'
import { createSignal } from 'solid-js'
import { authClient } from '~/lib/auth-client'
import { friendlyAuthError } from '~/lib/auth-errors'

export const Route = createFileRoute('/_app/signup')({
  head: () => ({ meta: [{ title: 'Create your account · jobscraft' }] }),
  component: Signup,
})

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [showPassword, setShowPassword] = createSignal(false)
  const [error, setError] = createSignal('')
  const [loading, setLoading] = createSignal(false)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await authClient.signUp.email({
      name: name(),
      email: email(),
      password: password(),
    })

    setLoading(false)

    if (result.error) {
      setError(friendlyAuthError(result.error.message))
      return
    }

    navigate({ to: '/dashboard' })
  }

  return (
    <main class="auth-shell">
      <h1>Create your account</h1>
      <div class="ledger-rule" style={{ "--section-accent": "var(--signal)" }} />
      <p class="auth-intro">Build your career once — use it everywhere.</p>

      <form class="auth-panel" onSubmit={handleSubmit}>
        <div class="field">
          <label for="name">Name</label>
          <input
            id="name"
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            required
          />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
          />
        </div>
        <div class="field">
          <div class="flex justify-between items-center">
            <label for="password">Password</label>
            <button
              type="button"
              class="text-[12px] text-graphite-soft underline"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword() ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="password"
            type={showPassword() ? "text" : "password"}
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            minLength={8}
          />
          <p class="text-[12px] text-graphite-soft">At least 8 characters</p>
        </div>
        {error() && <p class="auth-error">{error()}</p>}
        <button type="submit" class="btn-primary" disabled={loading()}>
          {loading() ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p class="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </main>
  )
}
