import { Link } from '@tanstack/solid-router'
import { createSignal, Show } from 'solid-js'
import { authClient } from '~/lib/auth-client'

export default function Header() {
  const session = authClient.useSession()
  const [menuOpen, setMenuOpen] = createSignal(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header class="site-header">
      <Link to="/" class="serif" style={{ "font-size": "20px" }} onClick={closeMenu}>jobscraft</Link>

      <button
        class="nav-toggle"
        aria-label="Toggle menu"
        aria-expanded={menuOpen()}
        onClick={() => setMenuOpen((open) => !open)}
      >
        ☰
      </button>

      <nav class="site-nav" classList={{ open: menuOpen() }}>
        <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
        <Link to="/roles" onClick={closeMenu}>My roles</Link>
        <Show when={!session().isPending}>
          <Show
            when={session().data?.user}
            fallback={
              <Link to="/login" class="btn-primary" style={{ "text-decoration": "none" }} onClick={closeMenu}>
                Sign in
              </Link>
            }
          >
            {(user) => (
              <>
                <span>{user().name || user().email}</span>
                <button class="btn-secondary" onClick={() => { void authClient.signOut(); closeMenu() }}>
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
