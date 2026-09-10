import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import { QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

import { HydrationScript } from 'solid-js/web'
import { Suspense } from 'solid-js'

import Header from '../components/Header'

import type { RouterContext } from '../router'

import styleCss from '../styles/app.css?url'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    links: [{ rel: 'stylesheet', href: styleCss }],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootComponent,
})

function NotFound() {
  return (
    <div style={{ "max-width": "420px", margin: "0 auto", padding: "96px 24px" }}>
      <h1 style={{ "font-size": "26px", margin: "0 0 8px" }}>Page not found</h1>
      <div class="ledger-rule" style={{ "--section-accent": "var(--ember)" }} />
      <p style={{ color: "var(--graphite-soft)", "font-size": "14px", "line-height": "1.6" }}>
        There's nothing at this address. It may have been unpublished or the link may be wrong.
      </p>
    </div>
  )
}

function RootComponent() {
  const context = Route.useRouteContext()

  return (
    <html>
      <head>
        <HydrationScript />
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={context().queryClient}>
          <Suspense>
            <Header />
            <Outlet />
            <TanStackRouterDevtools />
            <SolidQueryDevtools />
          </Suspense>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
