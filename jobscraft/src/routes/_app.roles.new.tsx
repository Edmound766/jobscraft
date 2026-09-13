import { createFileRoute, redirect, useNavigate } from '@tanstack/solid-router'
import { createServerFn } from '@tanstack/solid-start'
import { createForm } from '@tanstack/solid-form'
import { useQuery } from '@tanstack/solid-query'
import { createSignal, Show } from 'solid-js'
import { createRoleView } from '~/lib/roles'
import { listExperiences } from '~/lib/experience'
import { listProjects } from '~/lib/project'
import { requireUser } from '~/lib/session'

const ensureAuthenticated = createServerFn({ method: 'GET' }).handler(async () => {
  await requireUser()
})

export const Route = createFileRoute('/_app/roles/new')({
  beforeLoad: async () => {
    try {
      await ensureAuthenticated()
    } catch {
      throw redirect({ to: '/' })
    }
  },
  head: () => ({ meta: [{ title: 'Tailor for a role · jobscraft' }] }),
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

  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [submitError, setSubmitError] = createSignal(false)

  const form = createForm(() => ({
    defaultValues: { roleTitle: '', jobDescription: '' },
    onSubmit: async ({ value }) => {
      setSubmitError(false)
      setIsSubmitting(true)
      try {
        const row = await createRoleView({ data: value })
        navigate({ to: '/u/$slug', params: { slug: row.slug } })
      } catch {
        setSubmitError(true)
        setIsSubmitting(false)
      }
    },
  }))

  const canSubmit = () => !!(experienceQuery.data?.length || projectQuery.data?.length)
  return (
    <main class="max-w-[640px] mt-[60px] mx-auto mb-[100px] px-5 sm:px-10">
      <h1 class="text-[28px] mb-2">Tailor for a role</h1>
      <p class="text-graphite-soft text-[15px] mt-2 mb-8">
        Paste a job description — we'll pick your best-matching experience and projects and publish a page for it.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit()) return
          form.handleSubmit()
        }}
        class="flex flex-col gap-4"
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
  <p class="text-ember text-[13px]">
    Add at least one experience or project in your dashboard before tailoring a role.
  </p>
</Show>
<Show when={submitError()}>
  <p class="text-ember text-[13px]">
    Something went wrong — try again.
  </p>
</Show>
<button type="submit" class="btn-primary" disabled={isSubmitting() || !canSubmit()}>
  <Show
    when={isSubmitting()}
    fallback="Generate my page"
  >
    Matching your experience
    <span class="loading-dots"><span></span><span></span><span></span></span>
  </Show>
</button>
      </form>
    </main>
  )
}
