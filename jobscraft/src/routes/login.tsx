import { createFileRoute, useNavigate } from '@tanstack/solid-router'
import { createSignal } from 'solid-js'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/login')({
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
    <section style={{ "max-width": "360px", margin: "80px auto", padding: "0 40px" }}>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email()}
          onInput={(e) => setEmail(e.currentTarget.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
          required
          minLength={8}
        />
        {error() && <p style={{ color: "var(--ember)" }}>{error()}</p>}
        <button type="submit" class="btn-primary" disabled={loading()}>
          {loading() ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}
