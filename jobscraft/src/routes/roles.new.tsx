import { createFileRoute, redirect, useNavigate } from '@tanstack/solid-router'
import { createServerFn } from '@tanstack/solid-start'
import { createForm } from '@tanstack/solid-form'
import { useQuery } from '@tanstack/solid-query'
import { Show } from 'solid-js'
import { createRoleView } from '~/lib/roles'
import { listExperiences } from '~/lib/experience'
import { listProjects } from '~/lib/project'
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

  const experienceQuery = useQuery(() => ({
    queryKey: ['experiences'],
    queryFn: () => listExperiences(),
  }))
  const projectQuery = useQuery(() => ({
    queryKey: ['projects'],
    queryFn: () => listProjects(),
  }))

  const form = createForm(() => ({
    defaultValues: { roleTitle: '', jobDescription: '' },
    onSubmit: async ({ value }) => {
      const row = await createRoleView({ data: value })
      navigate({ to: '/u/$slug', params: { slug: row.slug } })
    },
  }))

  const canSubmit = () => !!(experienceQuery.data?.length || projectQuery.data?.length)
  return (
    <div style={{ "max-width": "640px", margin: "60px auto 100px", padding: "0 40px" }}>
      <h1>Tailor for a role</h1>
      <p style={{ color: "var(--graphite-soft)", "font-size": "15px", margin: "8px 0 32px" }}>
        Paste a job description — we'll pick your best-matching experience and projects and publish a page for it.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit()) return
          form.handleSubmit()
        }}
        style={{ display: "flex", "flex-direction": "column", gap: "16px" }}
      >
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
<Show when={!canSubmit()}>
  <p style={{ color: "var(--ember)", "font-size": "13px" }}>
    Add at least one experience or project in your dashboard before tailoring a role.
  </p>
</Show>
<button type="submit" class="btn-primary" disabled={!canSubmit()}>Generate my page</button>
      </form>
    </div>
  )
}
