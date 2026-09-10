import { createFileRoute, Link, useNavigate } from '@tanstack/solid-router'
import { createSignal } from 'solid-js'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/signup')({
  component: Signup,
})

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
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
      setError(result.error.message || 'Could not create your account')
      return
    }

    navigate({ to: '/dashboard' })
  }

  return (
    <section class="auth-shell">
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
          {loading() ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p class="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </section>
  )
}
