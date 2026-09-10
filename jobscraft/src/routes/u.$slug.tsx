import { createFileRoute } from '@tanstack/solid-router'
import { createServerFn } from '@tanstack/solid-start'
import { Show } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { db } from '~/db'
import { roleViews } from '~/db/schema'
import { eq } from 'drizzle-orm'

const getRoleView = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const [row] = await db.select().from(roleViews).where(eq(roleViews.slug, slug)).limit(1)
    return row ?? null
  })

export const Route = createFileRoute('/u/$slug')({
  component: PublicRoleView,
})

function PublicRoleView() {
  const params = Route.useParams()
  const roleQuery = useQuery(() => ({
    queryKey: ['roleView', params().slug],
    queryFn: () => getRoleView({ data: params().slug }),
  }))

  return (
    <div style={{ "max-width": "640px", margin: "60px auto 100px", padding: "0 40px" }}>
      <Show
        when={!roleQuery.isPending}
        fallback={<p style={{ color: "var(--graphite-soft)" }}>Loading…</p>}
      >
        <Show
          when={roleQuery.data}
          fallback={<p style={{ color: "var(--graphite-soft)" }}>No page found at this address.</p>}
        >
          {(role) => (
            <>
              <h1>{role().roleTitle}</h1>
              <p style={{ color: "var(--graphite-soft)", "font-size": "15px" }}>
                Match score: {role().matchScore}%
              </p>
              <p style={{ color: "var(--graphite-soft)", "font-style": "italic", "margin-top": "24px" }}>
                The full tailored view is still being built — this page is a placeholder.
              </p>
            </>
          )}
        </Show>
      </Show>
    </div>
  )
}
