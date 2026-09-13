import { createFileRoute, Link, useNavigate } from '@tanstack/solid-router'
import { createSignal } from 'solid-js'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Sign in · jobscraft' }] }),
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal('')
  const [loading, setLoading] = createSignal(false)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await authClient.signIn.email({
      email: email(),
      password: password(),
    })

    setLoading(false)

    if (result.error) {
      setError(result.error.message || 'Sign in failed')
      return
    }

    navigate({ to: '/dashboard' })
  }

  return (
    <section class="auth-shell">
      <h1>Sign in</h1>
      <div class="ledger-rule" style={{ "--section-accent": "var(--signal)" }} />
      <p class="auth-intro">Your career repository, wherever you left it.</p>

      <form class="auth-panel" onSubmit={handleSubmit}>
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
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            minLength={8}
          />
        </div>
        {error() && <p class="auth-error">{error()}</p>}
        <button type="submit" class="btn-primary" disabled={loading()}>
          {loading() ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p class="auth-switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </section>
  )
}
