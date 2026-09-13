import { Link } from '@tanstack/solid-router'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { authClient } from '~/lib/auth-client'

export default function Header() {
  const session = authClient.useSession()
  const [menuOpen, setMenuOpen] = createSignal(false)
  const closeMenu = () => setMenuOpen(false)
  let toggleRef: HTMLButtonElement | undefined
  let firstNavLinkRef: HTMLAnchorElement | undefined

  createEffect(() => {
    if (menuOpen()) {
      firstNavLinkRef?.focus()
    }
  })

  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen()) {
        setMenuOpen(false)
        toggleRef?.focus()
      }
    }
    document.addEventListener('keydown', handleKeydown)
    onCleanup(() => document.removeEventListener('keydown', handleKeydown))
  })

  return (
    <header class="flex justify-between items-center py-5 px-5 sm:px-10 border-b border-line relative">
      <Link to="/" class="serif text-[20px]" onClick={closeMenu}>jobscraft</Link>

      <button
        ref={toggleRef}
        class="sm:hidden inline-flex bg-transparent border border-line rounded-[3px] text-[18px] leading-none px-2.5 py-1.5"
        aria-label="Toggle menu"
        aria-expanded={menuOpen()}
        aria-controls="mobile-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        ☰
      </button>

      <nav
        id="mobile-nav"
        class="sm:flex sm:static sm:flex-row sm:items-center sm:gap-4 sm:border-0 sm:p-0 sm:bg-transparent sm:min-w-0 sm:rounded-none absolute top-full right-0 mt-px flex-col items-start gap-3 min-w-[200px] bg-vellum border border-line rounded-[3px] p-4 z-20"
        classList={{ flex: menuOpen(), hidden: !menuOpen() }}
      >
        <Link ref={firstNavLinkRef} to="/dashboard" onClick={closeMenu}>Dashboard</Link>
        <Link to="/roles" onClick={closeMenu}>My roles</Link>
        <Show when={!session().isPending}>
          <Show
            when={session().data?.user}
            fallback={
              <Link to="/login" class="btn-primary no-underline" onClick={closeMenu}>
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
