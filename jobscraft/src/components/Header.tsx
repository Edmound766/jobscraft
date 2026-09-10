import { Link } from '@tanstack/solid-router'
import { Show } from 'solid-js'
import { authClient } from '~/lib/auth-client'

export default function Header() {
  const session = authClient.useSession()

  return (
    <header style={{ display: "flex", "justify-content": "space-between", "align-items": "center", padding: "20px 40px", "border-bottom": "1px solid var(--line)" }}>
      <Link to="/" class="serif" style={{ "font-size": "20px" }}>jobscraft</Link>
      <nav style={{ display: "flex", gap: "16px", "align-items": "center" }}>
        <Link to="/dashboard">Dashboard</Link>
        <Show when={!session().isPending}>
          <Show
            when={session().data?.user}
            fallback={
              <Link to="/login" class="btn-primary" style={{ "text-decoration": "none" }}>
                Sign in
              </Link>
            }
          >
            {(user) => (
              <>
                <span>{user().name || user().email}</span>
                <button class="btn-secondary" onClick={() => void authClient.signOut()}>
                  Sign out
                </button>
              </>
            )}
          </Show>
        </Show>
      </nav>
    </header>
  )
}
