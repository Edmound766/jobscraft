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
    links: [
      { rel: 'stylesheet', href: styleCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
    meta:[
      {charSet:"utf-8"},
      {name:"viewport", content:"width=device-width, initial-scale=1"},
      {title: "jobscraft"},
    ]
  }),
  notFoundComponent: NotFound,
  shellComponent: RootComponent,
})

function NotFound() {
  return (
    <main class="max-w-[420px] mx-auto py-24 px-6">
      <h1 class="text-[28px] mb-2">Page not found</h1>
      <div class="ledger-rule" style={{ "--section-accent": "var(--ember)" }} />
      <p class="text-graphite-soft text-[14px] leading-[1.6]">
        There's nothing at this address. It may have been unpublished or the link may be wrong.
      </p>
    </main>
  )
}

function RootComponent() {
  const context = Route.useRouteContext()

  return (
    <html lang="en">
      <head>
        <HydrationScript />
      </head>
      <body>
        {/* Rendered in <body>, not <head>: HeadContent uses portals into the
            real <head>, but needs to stay part of the reactive tree that
            re-renders on client-side navigation (per its own doc comment) —
            placing it in <head> left the title/meta stuck on whatever the
            first server-rendered page was. */}
        <HeadContent />
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
