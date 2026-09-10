import { createFileRoute, redirect, useNavigate } from '@tanstack/solid-router'
import { createServerFn } from '@tanstack/solid-start'
import { createForm } from '@tanstack/solid-form'
import { createRoleView } from '~/lib/roles'
import { requireUser } from '~/lib/session'

const ensureAuthenticated = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
})

export const Route = createFileRoute('/roles/new')({
  beforeLoad: async () => {
    try {
      await ensureAuthenticated()
    } catch {
      throw redirect({ to: '/' })
    }
  },
  component: NewRole,
})

function NewRole() {
  const navigate = useNavigate()

  const form = createForm(() => ({
    defaultValues: { roleTitle: '', jobDescription: '' },
    onSubmit: async ({ value }) => {
      const row = await createRoleView({ data: value })
      navigate({ to: '/u/$slug', params: { slug: row.slug } })
    },
  }))

  return (
    <div style={{ "max-width": "640px", margin: "60px auto 100px", padding: "0 40px" }}>
      <h1>Tailor for a role</h1>
      <p style={{ color: "var(--graphite-soft)", "font-size": "15px", margin: "8px 0 32px" }}>
        Paste a job description — we'll pick your best-matching experience and projects and publish a page for it.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
        <form.Field name="roleTitle">
          {(field) => (
            <input
              class="input"
              placeholder="Role title (e.g. Backend Engineer)"
              value={field().state.value}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              required
            />
          )}
        </form.Field>
        <form.Field name="jobDescription">
          {(field) => (
            <textarea
              class="input"
              placeholder="Paste the job description"
              rows={10}
              value={field().state.value}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              required
            />
          )}
        </form.Field>
        <button type="submit" class="btn-primary">Generate my page</button>
      </form>
    </div>
  )
}
